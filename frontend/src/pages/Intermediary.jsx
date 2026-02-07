import { useState, useMemo } from 'react';
import { useRequests } from '../context/RequestContext';
import { REQUEST_STATUS, AUTO_FORWARD_TYPES } from '../lib/constants';
import { groupRequests } from '../lib/utils';
import StatsCard from '../components/StatsCard';
import DashboardCharts from '../components/DashboardCharts';
import CalendarView from '../components/CalendarView';
import {
    Clock, CheckCircle, XCircle, ArrowRight, CornerDownRight, MapPin,
    Search, Calendar, Filter, List, Activity, AlertCircle, LayoutDashboard, FileText, Table,
    ChevronDown, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { formatToLocalTime } from '../utils/dateFormatter';
import ErrorBoundary from '../components/ErrorBoundary';

const Intermediary = () => {
    const { requests: rawRequests, updateRequestStatus } = useRequests();
    const requests = rawRequests || []; // Defensive

    // View State
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'list'
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar' (Inside List Tab)

    // State for expanded groups (consistent with StudentPage)
    const [expandedGroups, setExpandedGroups] = useState({});
    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Local State for Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter(r => r.status === REQUEST_STATUS.PENDING).length;
        const today = requests.filter(r => {
            if (!r.created_at) return false;
            try { return isSameDay(parseISO(r.created_at), new Date()); } catch (e) { return false; }
        }).length;
        const completed = requests.filter(r => r.status === REQUEST_STATUS.COMPLETED).length;

        return { total, pending, today, completed };
    }, [requests]);

    // --- Filtering Logic ---
    const filteredGroupedRequests = useMemo(() => {
        const allGrouped = groupRequests(requests);

        return allGrouped.filter(group => {
            const desc = group.description ? group.description.toLowerCase() : '';
            const loc = group.location ? group.location.toLowerCase() : '';
            const id = group.id ? group.id.toString() : '';
            const searchLower = searchQuery.toLowerCase();

            // Check Group
            const groupMatches = (
                (statusFilter === 'ALL' || (group.status && group.status.toLowerCase() === statusFilter.toLowerCase())) &&
                (!dateFilter || (group.created_at && isSameDay(parseISO(group.created_at), parseISO(dateFilter)))) &&
                (desc.includes(searchLower) || loc.includes(searchLower) || id.includes(searchLower))
            );

            // Check Children
            const childrenMatch = group.children?.some(child => {
                const cDesc = child.description ? child.description.toLowerCase() : '';
                const cLoc = child.location ? child.location.toLowerCase() : '';
                const cId = child.id ? child.id.toString() : '';
                return (
                    (statusFilter === 'ALL' || (child.status && child.status.toLowerCase() === statusFilter.toLowerCase())) &&
                    (!dateFilter || (child.created_at && isSameDay(parseISO(child.created_at), parseISO(dateFilter)))) &&
                    (cDesc.includes(searchLower) || cLoc.includes(searchLower) || cId.includes(searchLower))
                );
            });

            return groupMatches || childrenMatch;
        });
    }, [requests, searchQuery, statusFilter, dateFilter]);

    // --- Handlers ---
    const getStatusColor = (status) => {
        switch (status) {
            case REQUEST_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
            case REQUEST_STATUS.ASSIGNED: return 'bg-blue-100 text-blue-800';
            case REQUEST_STATUS.COMPLETED: return 'bg-green-100 text-green-800';
            case REQUEST_STATUS.REJECTED: return 'bg-red-100 text-red-800';
            case REQUEST_STATUS.CANCELLED: return 'bg-gray-100 text-gray-800';
            case REQUEST_STATUS.CANCELLATION_REQUESTED: return 'bg-orange-100 text-orange-800 animate-pulse';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleForward = (id) => updateRequestStatus(id, REQUEST_STATUS.ASSIGNED, "Manually forwarded by Intermediary");
    const handleReject = (id) => {
        const reason = prompt('Nhập lý do từ chối:', 'Thông tin chưa rõ ràng');
        if (reason) updateRequestStatus(id, REQUEST_STATUS.REJECTED, reason);
    };

    const handleApproveCancel = (id) => {
        if (confirm('Xác nhận hủy yêu cầu này?')) {
            updateRequestStatus(id, 'cancelled', 'Hủy bỏ được chấp thuận bởi Intermediary');
        }
    };

    const handleRejectCancel = (id) => {
        updateRequestStatus(id, REQUEST_STATUS.ASSIGNED, 'Yêu cầu hủy bị từ chối, tiếp tục thực hiện');
    };

    // --- Components ---
    const RequestItem = ({ req, isChild = false }) => (
        <div className={`p-5 transition-all duration-300 hover:bg-gray-50 ${isChild ? 'bg-gray-50/50 border-t border-gray-100' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        {isChild && <CornerDownRight className="w-4 h-4 text-vin-blue" />}
                        <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest px-1.5 py-0.5 border border-gray-200">#{req.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none ${getStatusColor(req.status)}`}>
                            {req.status === 'pending' && 'CHỜ DUYỆT'}
                            {req.status === 'assigned' && 'ĐÃ CHUYỂN'}
                            {req.status === 'completed' && 'HOÀN THÀNH'}
                            {req.status === 'rejected' && 'TỪ CHỐI'}
                            {req.status === 'cancelled' && 'ĐÃ HỦY'}
                            {req.status === 'cancellation_requested' && 'YÊU CẦU HỦY'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center ml-2 border-l border-gray-200 pl-3">
                            <Clock className="w-3 h-3 mr-1 text-vin-blue" />
                            {formatToLocalTime(req.created_at)}
                        </span>
                    </div>
                    <div className={`mt-2 ${isChild ? 'ml-6' : ''}`}>
                        <div className="flex items-center space-x-3 mb-1.5">
                            <span className="text-sm font-bold text-vin-dark uppercase tracking-tight">{req.type}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-[11px] font-bold text-gray-500 flex items-center uppercase tracking-widest">
                                <MapPin className="w-3 h-3 mr-1.5 text-vin-red" /> {req.location}
                            </span>
                        </div>
                        <p className="text-sm text-vin-dark/80 leading-relaxed font-medium">{req.description}</p>

                        {req.status === 'rejected' && req.rejection_reason && (
                            <div className="mt-2 text-[11px] font-medium text-vin-red bg-vin-red/5 border-l-2 border-vin-red py-1 px-3">
                                Lý do: {req.rejection_reason}
                            </div>
                        )}

                        {req.history && req.history.length > 0 && (
                            <div className="mt-2 text-[10px] font-bold text-gray-400 flex items-center uppercase tracking-wider bg-gray-50 px-3 py-1 border-l-2 border-gray-200">
                                <Activity className="w-3 h-3 mr-2" />
                                {req.history?.length > 0 ? req.history[req.history.length - 1].note : ''}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4 min-w-[120px]">
                    {req.status === REQUEST_STATUS.PENDING && (
                        <>
                            <button
                                onClick={() => handleForward(req.id)}
                                className="bg-vin-blue hover:bg-[#0d3b6b] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center transition-all shadow-md active:translate-y-0.5 rounded-none"
                            >
                                DUYỆT & CHUYỂN <ArrowRight className="w-3 h-3 ml-2" />
                            </button>
                            <button
                                onClick={() => handleReject(req.id)}
                                className="bg-white border-2 border-vin-red text-vin-red hover:bg-vin-red hover:text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center transition-all active:translate-y-0.5 rounded-none"
                            >
                                <XCircle className="w-3 h-3 mr-2" /> TỪ CHỐI
                            </button>
                        </>
                    )}

                    {req.status === 'cancellation_requested' && !AUTO_FORWARD_TYPES.includes(req.type) && (
                        <>
                            <button
                                onClick={() => handleApproveCancel(req.id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center transition-all shadow-md active:translate-y-0.5 rounded-none"
                            >
                                <CheckCircle className="w-3 h-3 mr-2" /> DUYỆT HỦY
                            </button>
                            <button
                                onClick={() => handleRejectCancel(req.id)}
                                className="bg-white border-2 border-gray-400 text-gray-500 hover:bg-gray-500 hover:text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center transition-all active:translate-y-0.5 rounded-none"
                            >
                                <XCircle className="w-3 h-3 mr-2" /> KHÔNG HỦY
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header & Main Tabs (VinUni Style) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-vin-blue/10 pb-6">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="w-1.5 h-10 bg-vin-red"></div>
                    <div>
                        <h2 className="text-3xl font-bold text-vin-blue uppercase tracking-tight">Điều phối hệ thống</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">Control & Management Center</p>
                    </div>
                </div>

                <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-none scale-[0.9] origin-right">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center px-6 py-2.5 rounded-none text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-vin-blue text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center px-6 py-2.5 rounded-none text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-vin-blue text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText className="w-3.5 h-3.5 mr-2" />
                        Yêu cầu
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard title="Cần Duyệt" value={stats.pending} icon={AlertCircle} color="bg-yellow-500" />
                        <StatsCard title="Mới Hôm Nay" value={stats.today} icon={Activity} color="bg-blue-500" trend={12} />
                        <StatsCard title="Đã Hoàn Thành" value={stats.completed} icon={CheckCircle} color="bg-green-500" />
                        <StatsCard title="Tổng Yêu Cầu" value={stats.total} icon={List} color="bg-purple-500" />
                    </div>

                    {/* Charts */}
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Biểu Đồ Phân Tích</h3>
                        <DashboardCharts requests={requests} />
                    </div>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="space-y-6 animate-fade-in">

                    {/* View Switcher & Filters (VinUni Style) */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200 sticky top-0 z-10 transition-all">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
                            {/* View Switcher */}
                            <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-none">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center px-5 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white text-vin-blue shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <Table className="w-3.5 h-3.5 mr-2" />
                                    LIST
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex items-center px-5 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-vin-blue shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <Calendar className="w-3.5 h-3.5 mr-2" />
                                    CALENDAR
                                </button>
                            </div>

                            {/* Filters (Only for Table View) */}
                            {viewMode === 'table' && (
                                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="TÌM KIẾM YÊU CẦU..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 rounded-none border border-gray-200 focus:ring-1 focus:ring-vin-blue focus:border-vin-blue text-[11px] font-bold uppercase tracking-widest placeholder:text-gray-300 transition-all"
                                        />
                                    </div>
                                    <input
                                        type="date"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="pl-4 pr-3 py-3 rounded-none border border-gray-200 focus:ring-1 focus:ring-vin-blue focus:border-vin-blue text-[11px] font-bold uppercase tracking-widest transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Status Filter (VinUni Style) */}
                        {viewMode === 'table' && (
                            <div className="flex space-x-2 overflow-x-auto pb-1 mt-6">
                                {['ALL', 'PENDING', 'ASSIGNED', 'COMPLETED', 'REJECTED', 'CANCELLATION_REQUESTED'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${statusFilter === status
                                            ? 'bg-vin-blue text-white border-vin-blue shadow-md'
                                            : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {status === 'ALL' ? 'Tất cả' :
                                            status === 'PENDING' ? 'Chờ duyệt' :
                                                status === 'ASSIGNED' ? 'Đã chuyển' :
                                                    status === 'COMPLETED' ? 'Hoàn thành' :
                                                        status === 'REJECTED' ? 'Đã từ chối' : 'Yêu cầu hủy'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Content (VinUni Style) */}
                    {viewMode === 'table' ? (
                        <div className="bg-white shadow-sm overflow-hidden rounded-none border border-gray-200 min-h-[500px]">
                            <div className="bg-white px-8 py-5 border-b-2 border-gray-50 flex justify-between items-center relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-vin-blue"></div>
                                <h3 className="text-lg font-bold text-vin-blue uppercase tracking-widest">Danh sách yêu cầu</h3>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredGroupedRequests.length} ITEMS FOUND</span>
                            </div>

                            {filteredGroupedRequests.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                    <Filter className="w-12 h-12 text-gray-300 mb-3" />
                                    <p>Không tìm thấy yêu cầu phù hợp.</p>
                                    <button
                                        onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setDateFilter(''); }}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredGroupedRequests.map((group) => {
                                        const isExpanded = expandedGroups[group.id];
                                        const hasChildren = group.children && group.children.length > 0;
                                        const hasMultipleChildren = group.children && group.children.length > 1;

                                        // Collapsed: Show only the newest child (index 0)
                                        const childrenToShow = isExpanded
                                            ? group.children
                                            : (hasChildren ? [group.children[0]] : []);

                                        const hiddenChildrenCount = hasChildren ? group.children.length - childrenToShow.length : 0;

                                        return (
                                            <div key={group.id} className="bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex">
                                                    {/* Toggle Button Column */}
                                                    <div className="pl-4 pt-4">
                                                        {hasMultipleChildren ? (
                                                            <button
                                                                onClick={() => toggleGroup(group.id)}
                                                                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                            </button>
                                                        ) : (
                                                            <div className="w-7"></div> // Spacer
                                                        )}
                                                    </div>

                                                    {/* Content Column */}
                                                    <div className="flex-1">
                                                        {/* Parent Request */}
                                                        <RequestItem req={group} />

                                                        {/* Child Requests */}
                                                        {hasChildren && (
                                                            <div className="ml-4 border-l-2 border-gray-100 pl-2 pb-2">
                                                                {childrenToShow.map(child => (
                                                                    <RequestItem key={child.id} req={child} isChild={true} />
                                                                ))}

                                                                {/* Ellipsis if hidden children exist (Collapsed Mode) */}
                                                                {!isExpanded && hiddenChildrenCount > 0 && (
                                                                    <div
                                                                        className="flex items-center text-gray-400 text-xs py-2 px-4 cursor-pointer hover:text-blue-600"
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
                    ) : (
                        <div className="animate-fade-in">
                            <CalendarView requests={requests} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const IntermediaryWithBoundary = () => (
    <ErrorBoundary>
        <Intermediary />
    </ErrorBoundary>
);

export default IntermediaryWithBoundary;
