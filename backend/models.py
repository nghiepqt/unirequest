from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
import json
from enum import Enum

class RequestStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLATION_REQUESTED = "cancellation_requested"
    CANCELLED = "cancelled"

class UserRole(str, Enum):
    STUDENT = "student"
    INTERMEDIARY = "intermediary"
    BACKOFFICE = "backoffice"

class RequestBase(SQLModel):
    type: str
    location: str
    description: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class Request(RequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    history_json: str = Field(default='[]') 
    rejection_reason: Optional[str] = None
    
    # Foreign Key to User
    created_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Parent/Child Relationship
    parent_id: Optional[int] = Field(default=None, foreign_key="request.id")
    children: List["Request"] = Relationship(back_populates="parent")
    parent: Optional["Request"] = Relationship(back_populates="children", sa_relationship_kwargs={"remote_side": "Request.id"})

    # User Relationship
    created_by: Optional["User"] = Relationship()

    @property
    def history(self) -> List[Dict[str, Any]]:
        return json.loads(self.history_json)

    @history.setter
    def history(self, value: List[Dict[str, Any]]):
        self.history_json = json.dumps(value)

    @property
    def user_name(self) -> Optional[str]:
        return self.created_by.full_name if self.created_by else None

class RequestCreate(RequestBase):
    pass

class RequestRead(RequestBase):
    id: int
    status: RequestStatus
    created_at: datetime
    history: List[Dict[str, Any]]
    rejection_reason: Optional[str] = None
    created_by_id: Optional[int] = None
    parent_id: Optional[int] = None
    user_name: Optional[str] = None

class RequestUpdate(SQLModel):
    status: Optional[RequestStatus] = None
    note: Optional[str] = None 

# User Config
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    role: UserRole

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int

class UserLogin(SQLModel):
    email: str
    password: str

class Token(SQLModel):
    access_token: str
    token_type: str
