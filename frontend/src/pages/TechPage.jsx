import { useMemo, useState } from 'react';
import { useRequests } from '../context/RequestContext';
import { REQUEST_STATUS, AUTO_FORWARD_TYPES } from '../lib/constants';
import { groupRequests } from '../lib/utils';
import StatsCard from '../components/StatsCard';
import {
    Wrench, CheckSquare, Clock, CornerDownRight, MapPin, Activity, CheckCircle,
    ChevronDown, ChevronRight, MoreHorizontal, User, XCircle, Filter
} from 'lucide-react';
import { isSameDay, parseISO } from 'date-fns';
import { formatToLocalTime } from '../utils/dateFormatter';

const TechPage = () => {
    const { requests, updateRequestStatus } = useRequests();

    const groupedRequests = groupRequests(requests);

    const isAssigned = (req) => req.status === REQUEST_STATUS.ASSIGNED;
    const isCompleted = (req) => req.status === REQUEST_STATUS.COMPLETED;
    const isRejected = (req) => req.status === REQUEST_STATUS.REJECTED;
    const isCancellationRequested = (req) => req.status === REQUEST_STATUS.CANCELLATION_REQUESTED;

    // State
    const [expandedGroups, setExpandedGroups] = useState({});
    const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'REJECTED'

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const assigned = requests.filter(r => r.status === REQUEST_STATUS.ASSIGNED).length;
        const completedTotal = requests.filter(r => r.status === REQUEST_STATUS.COMPLETED).length;
        const completedToday = requests.filter(r =>
            r.status === REQUEST_STATUS.COMPLETED && isSameDay(parseISO(r.created_at), new Date())
        ).length;

        return { assigned, completedTotal, completedToday };
    }, [requests]);

    // Active Groups: Contains at least one ASSIGNED request OR (CANCELLATION_REQUESTED AND is Auto-Forward Type)
    const activeGroups = groupedRequests.filter(g =>
        isAssigned(g) || (isCancellationRequested(g) && AUTO_FORWARD_TYPES.includes(g.type)) ||
        g.children?.some(c => isAssigned(c) || (isCancellationRequested(c) && AUTO_FORWARD_TYPES.includes(c.type)))
    );

    // History Groups: Completed OR Rejected
    const historyGroups = groupedRequests.filter(g =>
        !activeGroups.includes(g) && (
            isCompleted(g) || isRejected(g) ||
            g.children?.some(c => isCompleted(c) || isRejected(c))
        )
    );

    // Filter History Display
    const displayedHistory = historyGroups.filter(g => {
        if (historyFilter === 'ALL') return true;

        // Check if group or any child matches filter
        const matchStatus = historyFilter === 'COMPLETED' ? REQUEST_STATUS.COMPLETED : REQUEST_STATUS.REJECTED;
        const groupMatch = g.status === matchStatus;
        const childMatch = g.children?.some(c => c.status === matchStatus);

        return groupMatch || childMatch;
    });

    const handleComplete = (id) => {
        const note = prompt('Ghi chú hoàn thành (tùy chọn):', 'Đã xử lý xong');
        updateRequestStatus(id, REQUEST_STATUS.COMPLETED, note || "Completed by Technician");
    };

    const handleReject = (id) => {
        const reason = prompt('Nhập lý do từ chối:', 'Không thể thực hiện');
        if (reason) updateRequestStatus(id, REQUEST_STATUS.REJECTED, reason);
    };

    const handleApproveCancel = (id) => {
        if (confirm('Xác nhận hủy yêu cầu này?')) {
            updateRequestStatus(id, 'cancelled', 'Hủy bỏ được chấp thuận bởi Technician');
        }
    };

    const handleRejectCancel = (id) => {
        updateRequestStatus(id, REQUEST_STATUS.ASSIGNED, 'Yêu cầu hủy bị từ chối, tiếp tục thực hiện');
    };

    const RequestItem = ({ req, isChild = false }) => (
        <div className={`p-5 transition-all duration-300 hover:bg-gray-50 ${isChild ? 'bg-gray-50/50 border-t border-gray-100' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        {isChild && <CornerDownRight className="w-4 h-4 text-vin-blue" />}
                        <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest px-1.5 py-0.5 border border-gray-200">#{req.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none ${req.status === 'assigned' ? 'bg-vin-blue/10 text-vin-blue border border-vin-blue/20' :
                            req.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                req.status === 'rejected' ? 'bg-vin-red/10 text-vin-red border border-vin-red/20' :
                                    req.status === 'cancellation_requested' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse' :
                                        'bg-gray-50 text-gray-500 border border-gray-200'
                            }`}>
                            {req.status === 'assigned' ? 'CẦN LÀM' :
                                req.status === 'completed' ? 'ĐÃ XONG' :
                                    req.status === 'rejected' ? 'ĐÃ TỪ CHỐI' :
                                        req.status === 'cancellation_requested' ? 'YÊU CẦU HỦY' : req.status}
                        </span>

                        {/* Creator Info */}
                        <span className="flex items-center text-[11px] font-bold text-gray-400 uppercase tracking-wide border-l border-gray-200 pl-3 ml-2">
                            <User className="w-3.5 h-3.5 mr-1.5 text-vin-blue" />
                            {req.user_name || 'N/A'}
                        </span>
                    </div>

                    <p className="text-[11px] text-gray-500 mb-1.5 flex items-center font-bold uppercase tracking-widest">
                        <MapPin className="w-3 h-3 mr-1.5 text-vin-red" /> {req.location}
                    </p>
                    <p className="text-sm font-semibold text-vin-dark leading-snug">{req.description}</p>

                    {req.status === 'rejected' && req.rejection_reason && (
                        <div className="mt-2 text-[11px] font-medium text-vin-red bg-vin-red/5 border-l-2 border-vin-red py-1 px-3">
                            Lý do: {req.rejection_reason}
                        </div>
                    )}

                    <div className="text-[10px] font-bold text-gray-400 mt-2 flex items-center tracking-widest">
                        <Clock className="w-3 h-3 mr-1" /> {formatToLocalTime(req.created_at)}
                        {req.status === 'completed' && req.history.length > 0 && (
                            <span className="text-green-600 ml-3 bg-green-50 px-2 py-0.5 border border-green-100 uppercase">
                                DONE: {formatToLocalTime(req.history[req.history.length - 1].timestamp)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                    {req.status === REQUEST_STATUS.ASSIGNED && (
                        <>
                            <button
                                onClick={() => handleComplete(req.id)}
                                className="bg-vin-blue hover:bg-[#0d3b6b] text-white px-4 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest flex items-center shadow-md transition-all w-full justify-center active:translate-y-0.5"
                            >
                                <CheckSquare className="w-4 h-4 mr-2" />
                                HOÀN THÀNH
                            </button>
                            <button
                                onClick={() => handleReject(req.id)}
                                className="bg-transparent border-2 border-vin-red text-vin-red hover:bg-vin-red hover:text-white px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest flex items-center transition-all w-full justify-center active:translate-y-0.5"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                TỪ CHỐI
                            </button>
                        </>
                    )}

                    {req.status === 'cancellation_requested' && (
                        <>
                            <button
                                onClick={() => handleApproveCancel(req.id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest flex items-center shadow-md transition-all w-full justify-center active:translate-y-0.5"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                DUYỆT HỦY
                            </button>
                            <button
                                onClick={() => handleRejectCancel(req.id)}
                                className="bg-transparent border-2 border-gray-400 text-gray-500 hover:bg-gray-500 hover:text-white px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest flex items-center transition-all w-full justify-center active:translate-y-0.5"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                KHÔNG HỦY
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Nhiệm Vụ Cần Làm"
                    value={stats.assigned}
                    icon={Wrench}
                    color="bg-orange-500"
                    trend={null}
                />
                <StatsCard
                    title="Đã Xong Hôm Nay"
                    value={stats.completedToday}
                    icon={Activity}
                    color="bg-green-500"
                />
                <StatsCard
                    title="Tổng Đã Xong"
                    value={stats.completedTotal}
                    icon={CheckCircle}
                    color="bg-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Tasks Column */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-vin-blue flex items-center border-b-2 pb-4 border-vin-blue/10 uppercase tracking-widest relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-vin-red"></div>
                        <Wrench className="w-5 h-5 mr-3 ml-3 text-vin-red" />
                        Nhiệm Vụ Đang Chờ
                        <span className="ml-auto text-[10px] font-bold bg-vin-blue text-white px-2 py-1 tracking-widest">
                            {activeGroups.length} GROUPS
                        </span>
                    </h2>

                    {activeGroups.length === 0 ? (
                        <p className="text-gray-500 italic p-6 bg-white border border-dashed border-gray-300 rounded-lg text-center">
                            Hiện không có nhiệm vụ nào!
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {activeGroups.map(group => {
                                const isExpanded = expandedGroups[group.id];
                                const hasChildren = group.children && group.children.length > 0;
                                const hasMultipleChildren = group.children && group.children.length > 1;

                                // Collapsed: Show only the newest child
                                const childrenToShow = isExpanded
                                    ? group.children
                                    : (hasChildren ? [group.children[0]] : []);
                                const hiddenChildrenCount = hasChildren ? group.children.length - childrenToShow.length : 0;

                                return (
                                    <div key={group.id} className="bg-white border-l-4 border-vin-red shadow-sm rounded-none overflow-hidden border-y border-r border-gray-200">
                                        <div className="flex">
                                            {/* Toggle Column */}
                                            <div className="pl-2 pt-4">
                                                {hasMultipleChildren ? (
                                                    <button
                                                        onClick={() => toggleGroup(group.id)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                    </button>
                                                ) : <div className="w-7"></div>}
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-1">
                                                {/* Parent */}
                                                <div className={isAssigned(group) ? "bg-white" : "bg-gray-50 opacity-75"}>
                                                    <RequestItem req={group} />
                                                </div>

                                                {/* Children */}
                                                {hasChildren && (
                                                    <div className="ml-4 border-l-2 border-orange-200 pl-0 pb-2">
                                                        {childrenToShow.map(child => (
                                                            <RequestItem key={child.id} req={child} isChild={true} />
                                                        ))}

                                                        {/* "Show more" toggle at bottom */}
                                                        {!isExpanded && hiddenChildrenCount > 0 && (
                                                            <div
                                                                className="flex items-center text-gray-500 text-xs py-2 px-4 cursor-pointer hover:text-orange-600"
                                                                onClick={() => toggleGroup(group.id)}
                                                            >
                                                                <MoreHorizontal className="w-4 h-4 mr-2" />
                                                                <span>Còn {hiddenChildrenCount} yêu cầu khác...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Completed History Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 pb-4 border-vin-blue/10 relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-vin-blue"></div>
                        <h2 className="text-lg font-bold text-vin-blue flex items-center uppercase tracking-widest ml-3">
                            <Clock className="w-5 h-5 mr-3 text-vin-blue" />
                            Lịch Sử
                        </h2>

                        {/* History Filters (VinUni Style) */}
                        <div className="flex bg-gray-50 border border-gray-200 p-0.5 rounded-none">
                            <button
                                onClick={() => setHistoryFilter('ALL')}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all ${historyFilter === 'ALL' ? 'bg-vin-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                ALL
                            </button>
                            <button
                                onClick={() => setHistoryFilter('COMPLETED')}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all ${historyFilter === 'COMPLETED' ? 'bg-vin-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                DONE
                            </button>
                            <button
                                onClick={() => setHistoryFilter('REJECTED')}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all ${historyFilter === 'REJECTED' ? 'bg-vin-red text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                REJ
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
                        {displayedHistory.length === 0 ? (
                            <p className="text-gray-500 italic text-sm text-center py-4">Chưa có lịch sử phù hợp.</p>
                        ) : (
                            displayedHistory.map(group => {
                                const isExpanded = expandedGroups[group.id];
                                const hasChildren = group.children && group.children.length > 0;
                                const hasMultipleChildren = group.children && group.children.length > 1;

                                const childrenToShow = isExpanded
                                    ? group.children
                                    : (hasChildren ? [group.children[0]] : []);
                                const hiddenChildrenCount = hasChildren ? group.children.length - childrenToShow.length : 0;

                                return (
                                    <div key={group.id} className="bg-white border border-gray-200 rounded-lg opacity-90 hover:opacity-100 transition-opacity">
                                        <div className="flex">
                                            {/* Toggle Column */}
                                            <div className="pl-2 pt-4">
                                                {hasMultipleChildren ? (
                                                    <button
                                                        onClick={() => toggleGroup(group.id)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                    </button>
                                                ) : <div className="w-7"></div>}
                                            </div>

                                            <div className="flex-1">
                                                <RequestItem req={group} />

                                                {hasChildren && (
                                                    <div className="ml-4 border-l border-gray-100 pl-2 pb-2">
                                                        {childrenToShow.map(child => (
                                                            <RequestItem key={child.id} req={child} isChild={true} />
                                                        ))}

                                                        {!isExpanded && hiddenChildrenCount > 0 && (
                                                            <div
                                                                className="flex items-center text-gray-400 text-xs py-2 px-4 cursor-pointer hover:text-gray-600"
                                                                onClick={() => toggleGroup(group.id)}
                                                            >
                                                                <MoreHorizontal className="w-4 h-4 mr-2" />
                                                                <span>Còn {hiddenChildrenCount} yêu cầu khác...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechPage;
