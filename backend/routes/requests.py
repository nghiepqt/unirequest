from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from ..database import get_session
from ..models import Request, RequestCreate, RequestRead, RequestUpdate, RequestStatus, User
from ..auth import get_current_user

router = APIRouter()

AUTO_FORWARD_TYPES = [
    "Sử dụng CSVC",
    "Mở cửa phòng",
]

@router.post("/", response_model=RequestRead)
def create_request(
    request: RequestCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    return create_new_request(request, session, current_user)

@router.post("/{request_id}/sub", response_model=RequestRead)
def create_sub_request(
    request_id: int,
    request: RequestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check parent
    parent_request = session.get(Request, request_id)
    if not parent_request:
        raise HTTPException(status_code=404, detail="Parent request not found")
        
    # Prevent nesting (max depth 1)
    if parent_request.parent_id is not None:
        raise HTTPException(status_code=400, detail="Cannot create sub-request of a sub-request")
        
    return create_new_request(request, session, current_user, parent_id=request_id)

def create_new_request(request: RequestCreate, session: Session, current_user: User, parent_id: Optional[int] = None):
    # Auto-forward logic
    is_auto = request.type in AUTO_FORWARD_TYPES
    status = RequestStatus.ASSIGNED if is_auto else RequestStatus.PENDING
    
    # Create History Log
    history = [
        {
            "action": "Created",
            "timestamp": datetime.now().isoformat(),
            "note": f"Request created by {current_user.full_name}"
        }
    ]
    
    if is_auto:
        history.append({
            "action": "Auto-Forwarded",
            "timestamp": datetime.now().isoformat(),
            "note": "System auto-forwarded to Technician due to request type"
        })
        
    db_request = Request.from_orm(request)
    db_request.status = status
    db_request.history = history
    db_request.created_by_id = current_user.id
    db_request.parent_id = parent_id
    
    session.add(db_request)
    session.commit()
    session.refresh(db_request)
    return db_request

from sqlalchemy.orm import selectinload

# ... (existing imports)

@router.get("/", response_model=List[RequestRead])
def read_requests(
    offset: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(Request).options(selectinload(Request.created_by))
    if status:
        query = query.where(Request.status == status)
    
    requests = session.exec(query.offset(offset).limit(limit)).all()
    return requests

@router.get("/{request_id}", response_model=RequestRead)
def read_request(request_id: int, session: Session = Depends(get_session)):
    request = session.get(Request, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

@router.patch("/{request_id}", response_model=RequestRead)
def update_request(
    request_id: int, 
    request_update: RequestUpdate, 
    session: Session = Depends(get_session)
):
    db_request = session.get(Request, request_id)
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request_update.status:
        db_request.status = request_update.status
        
        # Save rejection reason if applicable
        if request_update.status == RequestStatus.REJECTED and request_update.note:
             db_request.rejection_reason = request_update.note
        
        # Add to history
        current_history = db_request.history
        current_history.append({
            "action": f"Status changed to {request_update.status}",
            "timestamp": datetime.now().isoformat(),
            "note": request_update.note or "Status updated via API"
        })
        db_request.history = current_history
        
    session.add(db_request)
    session.commit()
    session.refresh(db_request)
    return db_request

@router.post("/{request_id}/cancel", response_model=RequestRead)
def cancel_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_request = session.get(Request, request_id)
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Check ownership (simple check)
    if db_request.created_by_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to cancel this request")
         
    # Cancel Main Request
    status_update = RequestStatus.CANCELLED
    note = "Cancelled by user"
    
    cancel_single_request(db_request, status_update, note, session)
    
    # Cascade Cancel Children
    statement = select(Request).where(Request.parent_id == request_id)
    children = session.exec(statement).all()
    for child in children:
        cancel_single_request(child, status_update, "Cancelled because parent request was cancelled", session)
        
    session.commit()
    session.refresh(db_request)
    return db_request

def cancel_single_request(req: Request, status: str, note: str, session: Session):
    req.status = status
    current_history = req.history
    current_history.append({
        "action": "Cancelled",
        "timestamp": datetime.now().isoformat(),
        "note": note
    })
    req.history = current_history
    session.add(req)
