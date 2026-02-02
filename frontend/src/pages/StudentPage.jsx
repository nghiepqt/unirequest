import { useState, useMemo } from 'react';
import { useRequests } from '../context/RequestContext';
import { useAuth } from '../context/AuthContext';
import { groupRequests } from '../lib/utils';
import { REQUEST_TYPES } from '../lib/constants';
import { Send, MapPin, FileText, CheckCircle, Clock, GitBranch, XCircle, AlertTriangle, CornerDownRight, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';

const StudentPage = () => {
    const { requests, addRequest, cancelRequest } = useRequests();
    const { user } = useAuth();

    // Initial Form State
    const initialForm = {
        type: REQUEST_TYPES[0],
        location: '',
        description: '',
        start_time: '',
        end_time: ''
    };

    const [formData, setFormData] = useState(initialForm);
    const [submittedId, setSubmittedId] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [parentRequest, setParentRequest] = useState(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [requestToCancel, setRequestToCancel] = useState(null);

    // State for expanded groups
    const [expandedGroups, setExpandedGroups] = useState({});

    // Tab State: 'send' | 'track'
    const [activeTab, setActiveTab] = useState('send');

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Filter and Group Requests
    const groupedRequests = useMemo(() => {
        if (!user) return [];
        const myReqs = requests.filter(req => req.created_by_id === user.id);
        return groupRequests(myReqs);
    }, [requests, user]);

    // Validation Logic
    const validateForm = () => {
        const descLength = formData.description.length;
        const maxLimit = formData.type === "Khác" ? 500 : 200;

        if (descLength > maxLimit) {
            setValidationError(`Mô tả quá dài! Giới hạn ${maxLimit} ký tự cho loại yêu cầu này.`);
            return false;
        }
        if (formData.type === "Sử dụng CSVC") {
            if (formData.start_time && formData.end_time) {
                if (new Date(formData.start_time) >= new Date(formData.end_time)) {
                    setValidationError('Thời gian kết thúc phải sau thời gian bắt đầu.');
                    return false;
                }
            }
        }
        setValidationError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = { ...formData };
        if (payload.type !== "Sử dụng CSVC") {
            delete payload.start_time;
            delete payload.end_time;
        } else {
            if (!payload.start_time) delete payload.start_time;
            if (!payload.end_time) delete payload.end_time;
        }

        const req = await addRequest(payload, parentRequest ? parentRequest.id : null);

        if (req) {
            setSubmittedId(req.id);
            setFormData(initialForm);
            setParentRequest(null);
            setTimeout(() => setSubmittedId(null), 3000);
            setActiveTab('track'); // Switch to track tab
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const initiateSubRequest = (req) => {
        setParentRequest(req);
        setFormData({
            ...initialForm,
            type: req.type,
            location: req.location
        });
        setActiveTab('send'); // Switch to send tab
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmCancel = (req) => {
        setRequestToCancel(req);
        setIsCancelModalOpen(true);
    };

    const handleCancel = async () => {
        if (requestToCancel) {
            await cancelRequest(requestToCancel.id);
            setIsCancelModalOpen(false);
            setRequestToCancel(null);
        }
    };

    const getTypeBadgeColor = (type) => {
        if (type === "Sử dụng CSVC") return "bg-blue-100 text-blue-800";
        if (type === "Khác") return "bg-gray-100 text-gray-800";
        if (type?.includes("child")) return "bg-purple-100 text-purple-800";
        return "bg-indigo-100 text-indigo-800";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'assigned': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-300 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const RequestItem = ({ req, isChild = false }) => (
        <div className={`p-4 ${isChild ? 'bg-gray-50 border-t border-gray-100' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        {isChild && <CornerDownRight className="w-4 h-4 text-gray-400" />}
                        <span className="font-mono text-xs text-gray-500">#{req.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(req.type)}`}>
                            {req.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                            {req.status === 'pending' && 'Đang chờ xử lý'}
                            {req.status === 'assigned' && 'Đã tiếp nhận'}
                            {req.status === 'completed' && 'Hoàn thành'}
                            {req.status === 'rejected' && 'Từ chối'}
                            {req.status === 'cancelled' && 'Đã hủy'}
                        </span>
                    </div>
                    <div className="mt-1">
                        <p className="text-sm text-gray-900">{req.description}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" /> {req.location}
                            <span className="mx-2">•</span>
                            <Clock className="w-3 h-3 mr-1" /> {new Date(req.created_at).toLocaleString()}
                        </p>
                        {(req.start_time || req.end_time) && (
                            <div className="text-xs text-blue-600 mt-1 font-medium ml-4">
                                SD: {req.start_time ? new Date(req.start_time).toLocaleString() : '...'}
                                {' -> '}
                                {req.end_time ? new Date(req.end_time).toLocaleString() : '...'}
                            </div>
                        )}
                        {req.status === 'rejected' && req.rejection_reason && (
                            <div className="text-xs text-red-600 mt-1 bg-red-50 p-1 px-2 rounded inline-block">
                                Lý do: {req.rejection_reason}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                    {req.status !== 'cancelled' && req.status !== 'completed' && req.status !== 'rejected' && (
                        <>
                            {!isChild && (
                                <button
                                    onClick={() => initiateSubRequest(req)}
                                    className="text-purple-600 hover:text-purple-800 text-xs flex items-center justify-end font-medium"
                                >
                                    <GitBranch className="w-3 h-3 mr-1" /> Tạo yêu cầu phụ
                                </button>
                            )}
                            <button
                                onClick={() => confirmCancel(req)}
                                className="text-red-600 hover:text-red-800 text-xs flex items-center justify-end font-medium"
                            >
                                <XCircle className="w-3 h-3 mr-1" /> Hủy
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Tabs Navigation (Pill Style) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Cổng Thông Tin Sinh Viên</h2>

                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`
                            flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
                            ${activeTab === 'send'
                                ? 'bg-white text-blue-600 shadow'
                                : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Gửi Yêu Cầu
                    </button>
                    <button
                        onClick={() => setActiveTab('track')}
                        className={`
                            flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
                            ${activeTab === 'track'
                                ? 'bg-white text-blue-600 shadow'
                                : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Theo Dõi
                    </button>
                </div>
            </div>

            {/* Tab 1: Send Request */}
            {activeTab === 'send' && (
                <div className={`max-w-2xl mx-auto transition-all ${parentRequest ? 'ring-2 ring-purple-400 rounded-xl' : ''}`}>
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className={`${parentRequest ? 'bg-purple-600' : 'bg-blue-600'} px-6 py-4 transition-colors`}>
                            <h2 className="text-xl font-bold text-white flex items-center">
                                {parentRequest ? <GitBranch className="w-5 h-5 mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                {parentRequest ? `Tạo Yêu cầu phụ cho yêu cầu #${parentRequest.id}` : 'Gửi Yêu Cầu Hỗ Trợ'}
                            </h2>
                        </div>

                        <div className="p-6">
                            {submittedId && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center animate-pulse">
                                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                                    <div>
                                        <p className="font-medium text-green-800">Yêu cầu đã được gửi thành công!</p>
                                        <p className="text-sm text-green-600">Mã yêu cầu: #{submittedId}</p>
                                    </div>
                                </div>
                            )}
                            {validationError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {validationError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại yêu cầu</label>
                                    {parentRequest ? (
                                        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-gray-500">
                                            {formData.type}
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border bg-white"
                                        >
                                            {REQUEST_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {formData.type === "Sử dụng CSVC" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                        <div className="col-span-2 text-sm text-blue-700 font-medium flex items-center mb-1">
                                            <Clock className="w-4 h-4 mr-1" /> Thời gian sử dụng
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Bắt đầu</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                                className="w-full rounded border-gray-300 shadow-sm text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Kết thúc</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.end_time}
                                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                                className="w-full rounded border-gray-300 shadow-sm text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <span className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                            Địa điểm (Phòng, Khu vực)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: JB111, K201"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <span className="flex items-center">
                                            <FileText className="w-4 h-4 mr-1 text-gray-400" />
                                            Mô tả chi tiết
                                            <span className="ml-2 text-xs text-gray-400 font-normal">
                                                (Tối đa {formData.type === "Khác" ? 500 : 200} ký tự)
                                            </span>
                                        </span>
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Mô tả sự cố hoặc yêu cầu cụ thể..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
                                    />
                                    <div className="text-right text-xs text-gray-400 mt-1">
                                        {formData.description.length} / {formData.type === "Khác" ? 500 : 200}
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    {parentRequest && (
                                        <button
                                            type="button"
                                            onClick={() => setParentRequest(null)}
                                            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Hủy tạo con
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className={`flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${parentRequest ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
                                    >
                                        Gửi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Track Requests */}
            {activeTab === 'track' && (
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Theo Dõi Yêu Cầu</h3>
                    </div>
                    {groupedRequests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Bạn chưa gửi yêu cầu nào.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {groupedRequests.map((group) => {
                                const isExpanded = expandedGroups[group.id];
                                const hasChildren = group.children && group.children.length > 0;
                                const hasMultipleChildren = group.children && group.children.length > 1;

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
                                                {/* Root Request */}
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
            )}

            {/* Cancel Confirmation Modal */}
            {isCancelModalOpen && requestToCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                            Xác nhận hủy yêu cầu #{requestToCancel.id}?
                        </h3>
                        <p className="text-sm text-center text-gray-500 mb-6">
                            {!requestToCancel.parent_id
                                ? "Đây là yêu cầu gốc. Hành động này sẽ hủy tất cả các yêu cầu phụ liên quan."
                                : "Bạn đang hủy một yêu cầu phụ."
                            }
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setIsCancelModalOpen(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                                Xác nhận Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPage;
