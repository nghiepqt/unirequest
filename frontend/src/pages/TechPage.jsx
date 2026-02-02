import { useMemo, useState } from 'react';
import { useRequests } from '../context/RequestContext';
import { REQUEST_STATUS } from '../lib/constants';
import { groupRequests } from '../lib/utils';
import StatsCard from '../components/StatsCard';
import {
    Wrench, CheckSquare, Clock, CornerDownRight, MapPin, Activity, CheckCircle,
    ChevronDown, ChevronRight, MoreHorizontal, User, XCircle, Filter
} from 'lucide-react';
import { isSameDay, parseISO } from 'date-fns';

const TechPage = () => {
    const { requests, updateRequestStatus } = useRequests();

    const groupedRequests = groupRequests(requests);

    const isAssigned = (req) => req.status === REQUEST_STATUS.ASSIGNED;
    const isCompleted = (req) => req.status === REQUEST_STATUS.COMPLETED;
    const isRejected = (req) => req.status === REQUEST_STATUS.REJECTED;

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

    // Active Groups: Contains at least one ASSIGNED request
    const activeGroups = groupedRequests.filter(g =>
        isAssigned(g) || g.children?.some(c => isAssigned(c))
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

    const RequestItem = ({ req, isChild = false }) => (
        <div className={`p-3 ${isChild ? 'bg-orange-50/50 border-t border-orange-100' : ''} transition-colors`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        {isChild && <CornerDownRight className="w-4 h-4 text-gray-400" />}
                        <span className="font-semibold text-gray-800">{req.type}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            req.status === 'completed' ? 'bg-green-100 text-green-800' :
                                req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            {req.status === 'assigned' ? 'CẦN LÀM' :
                                req.status === 'completed' ? 'ĐÃ XONG' :
                                    req.status === 'rejected' ? 'ĐÃ TỪ CHỐI' : req.status}
                        </span>

                        {/* Creator Info */}
                        <span className="flex items-center text-xs text-gray-500 border-l border-gray-300 pl-2 ml-2">
                            <User className="w-3 h-3 mr-1" />
                            {req.user_name || 'N/A'}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {req.location}
                    </p>
                    <p className="text-sm text-gray-700">{req.description}</p>

                    {req.status === 'rejected' && req.rejection_reason && (
                        <div className="text-xs text-red-600 mt-1 bg-red-50 p-1 px-2 rounded inline-block">
                            Lý do: {req.rejection_reason}
                        </div>
                    )}

                    <div className="text-xs text-gray-400 mt-1">
                        {new Date(req.created_at).toLocaleString()}
                        {req.status === 'completed' && req.history.length > 0 && (
                            <span className="text-green-600 ml-2">
                                (Xong: {new Date(req.history[req.history.length - 1].timestamp).toLocaleTimeString()})
                            </span>
                        )}
                    </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                    {req.status === REQUEST_STATUS.ASSIGNED && (
                        <>
                            <button
                                onClick={() => handleComplete(req.id)}
                                className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold flex items-center shadow-sm w-full justify-center"
                            >
                                <CheckSquare className="w-4 h-4 mr-1" />
                                HOÀN THÀNH
                            </button>
                            <button
                                onClick={() => handleReject(req.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold flex items-center shadow-sm w-full justify-center"
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                TỪ CHỐI
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
                    <h2 className="text-xl font-bold text-gray-800 flex items-center border-b pb-2 border-gray-200">
                        <Wrench className="w-5 h-5 mr-2 text-orange-600" />
                        Nhiệm Vụ Đang Chờ ({activeGroups.length} nhóm)
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
                                    <div key={group.id} className="bg-white border-l-4 border-orange-500 shadow-sm rounded-r-lg overflow-hidden border-y border-r border-gray-200">
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
                    <div className="flex items-center justify-between border-b pb-2 border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-green-600" />
                            Lịch Sử
                        </h2>

                        {/* History Filters */}
                        <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-lg">
                            <button
                                onClick={() => setHistoryFilter('ALL')}
                                className={`px-2 py-1 text-xs font-medium rounded ${historyFilter === 'ALL' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setHistoryFilter('COMPLETED')}
                                className={`px-2 py-1 text-xs font-medium rounded ${historyFilter === 'COMPLETED' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Đã xong
                            </button>
                            <button
                                onClick={() => setHistoryFilter('REJECTED')}
                                className={`px-2 py-1 text-xs font-medium rounded ${historyFilter === 'REJECTED' ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Từ chối
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
