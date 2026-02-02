import { useState, useMemo } from 'react';
import { useRequests } from '../context/RequestContext';
import { REQUEST_STATUS } from '../lib/constants';
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
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleForward = (id) => updateRequestStatus(id, REQUEST_STATUS.ASSIGNED, "Manually forwarded by Intermediary");
    const handleReject = (id) => {
        const reason = prompt('Nhập lý do từ chối:', 'Thông tin chưa rõ ràng');
        if (reason) updateRequestStatus(id, REQUEST_STATUS.REJECTED, reason);
    };

    // --- Components ---
    const RequestItem = ({ req, isChild = false }) => (
        <div className={`p-4 ${isChild ? 'bg-gray-50 border-t border-gray-100' : ''} hover:bg-blue-50/30 transition-colors`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        {isChild && <CornerDownRight className="w-4 h-4 text-gray-400" />}
                        <span className="font-mono text-xs text-gray-500">#{req.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                            {req.status === 'pending' && 'CHỜ DUYỆT'}
                            {req.status === 'assigned' && 'ĐÃ CHUYỂN'}
                            {req.status === 'completed' && 'HOÀN THÀNH'}
                            {req.status === 'rejected' && 'TỪ CHỐI'}
                            {req.status === 'cancelled' && 'ĐÃ HỦY'}
                        </span>
                        <span className="text-xs text-gray-400">
                            {req.created_at ? format(parseISO(req.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        </span>
                    </div>
                    <div className={`mt-2 ${isChild ? 'ml-6' : ''}`}>
                        <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{req.type}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" /> {req.location}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{req.description}</p>

                        {req.status === 'rejected' && req.rejection_reason && (
                            <div className="text-xs text-red-600 mt-1 bg-red-50 p-1 px-2 rounded inline-block">
                                Lý do: {req.rejection_reason}
                            </div>
                        )}

                        {req.history && req.history.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {req.history?.length > 0 ? req.history[req.history.length - 1].note : ''}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                    {req.status === REQUEST_STATUS.PENDING && (
                        <>
                            <button
                                onClick={() => handleForward(req.id)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center justify-end px-2 py-1 bg-blue-50 rounded border border-blue-100 hover:bg-blue-100"
                            >
                                Duyệt & Chuyển <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                            <button
                                onClick={() => handleReject(req.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center justify-end px-2 py-1 bg-red-50 rounded border border-red-100 hover:bg-red-100"
                            >
                                <XCircle className="w-3 h-3 mr-1" /> Từ chối
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header & Main Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Điều Phối & Giám Sát</h2>

                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Quản Lý Yêu Cầu
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

                    {/* View Switcher & Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-0 z-10">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                            {/* View Switcher */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Table className="w-4 h-4 mr-2" />
                                    Bảng
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Lịch Biểu
                                </button>
                            </div>

                            {/* Filters (Only for Table View) */}
                            {viewMode === 'table' && (
                                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <input
                                        type="date"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="pl-3 pr-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Status Tabs (Only for Table View) */}
                        {viewMode === 'table' && (
                            <div className="flex space-x-2 overflow-x-auto pb-1">
                                {['ALL', 'PENDING', 'ASSIGNED', 'COMPLETED', 'REJECTED'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status
                                            ? 'bg-gray-800 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status === 'ALL' ? 'Tất cả' :
                                            status === 'PENDING' ? 'Chờ duyệt' :
                                                status === 'ASSIGNED' ? 'Đã chuyển' :
                                                    status === 'COMPLETED' ? 'Hoàn thành' : 'Đã từ chối'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Content */}
                    {viewMode === 'table' ? (
                        <div className="bg-white shadow overflow-hidden rounded-xl border border-gray-200 min-h-[500px]">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700">Danh Sách Yêu Cầu ({filteredGroupedRequests.length})</h3>
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
