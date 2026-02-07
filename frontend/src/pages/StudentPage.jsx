import { useState, useEffect, useMemo, useRef } from 'react';
import { useRequests } from '../context/RequestContext';
import { useAuth } from '../context/AuthContext';
import { groupRequests } from '../lib/utils';
import { REQUEST_TYPES } from '../lib/constants';
import VinDatePicker from '../components/VinDatePicker';
import NotificationPopup from '../components/NotificationPopup';
import CancelRequestModal from '../components/CancelRequestModal';
import { MapPin, Clock, Calendar, Send, Loader2, AlertTriangle, XCircle, ChevronRight, CornerDownRight, Activity, FileText, CheckCircle, GitBranch, MoreHorizontal, ChevronDown, Trash2 } from 'lucide-react';
import { formatToLocalTime } from '../utils/dateFormatter';
import { isSameDay } from 'date-fns';

// Extracted RequestItem Component
const RequestItem = ({ req, isChild = false, animatingIds, initiateSubRequest, confirmCancel, handleDelete, getTypeBadgeColor, getStatusColor }) => {
    // Determine extra animation classes
    let animationClass = "";

    const canModifyCompletedRequest = (req) => {
        if (req.status !== 'completed') return true; // Standard logic for others

        const now = new Date();
        if (req.type === 'Sử dụng CSVC') {
            // Allowed only if event has NOT ended
            return req.end_time && now < new Date(req.end_time);
        } else {
            // Allowed only if SAME DAY
            return req.created_at && isSameDay(now, new Date(req.created_at));
        }
    };

    const isActionable = canModifyCompletedRequest(req);

    // Check transient animation state
    const animType = animatingIds[req.id];

    if (animType === 'blue') {
        animationClass = "animate-border-blue";
    } else if (animType === 'green') {
        animationClass = "animate-border-green animate-flash-green";
    } else if (animType === 'red') {
        animationClass = "animate-border-red animate-flash-red";
    }

    return (
        <div className={`p-5 transition-all duration-300 hover:bg-gray-50 ${isChild ? 'bg-gray-50/50 border-t border-gray-100' : ''} ${animationClass}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        {isChild && <CornerDownRight className="w-4 h-4 text-vin-blue" />}
                        <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest px-1.5 py-0.5 border border-gray-200">#{req.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none ${getTypeBadgeColor(req.type)}`}>
                            {req.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none ${getStatusColor(req.status)}`}>
                            {req.status === 'pending' && 'Đang chờ'}
                            {req.status === 'assigned' && 'Tiếp nhận'}
                            {req.status === 'completed' && 'Hoàn thành'}
                            {req.status === 'rejected' && 'Từ chối'}
                            {req.status === 'cancelled' && 'Đã hủy'}
                            {req.status === 'cancellation_requested' && 'Đang hủy'}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-vin-dark leading-snug">{req.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className="text-[11px] text-gray-500 flex items-center font-medium">
                                <MapPin className="w-3 h-3 mr-1 text-vin-red" /> {req.location}
                            </span>
                            <span className="text-[11px] text-gray-500 flex items-center font-medium">
                                <Clock className="w-3 h-3 mr-1 text-vin-blue" /> {formatToLocalTime(req.created_at)}
                            </span>
                        </div>
                        {(req.start_time || req.end_time) && (
                            <div className="mt-2 flex items-center text-[10px] font-bold text-vin-blue bg-vin-blue/5 border-l-2 border-vin-blue py-1 px-3">
                                {req.start_time ? formatToLocalTime(req.start_time) : '...'}
                                <ChevronRight className="w-3 h-3 mx-1" />
                                {req.end_time ? formatToLocalTime(req.end_time) : '...'}
                            </div>
                        )}
                        {req.status === 'rejected' && req.rejection_reason && (
                            <div className="mt-2 text-[11px] font-medium text-vin-red bg-vin-red/5 border-l-2 border-vin-red py-1 px-3">
                                Lý do: {req.rejection_reason}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                    {req.status !== 'cancelled' && req.status !== 'rejected' && req.status !== 'cancellation_requested' && isActionable && (
                        <>
                            {!isChild && (
                                <button
                                    onClick={() => initiateSubRequest(req)}
                                    className="text-vin-blue hover:text-vin-blue/80 text-[10px] font-bold uppercase tracking-wider flex items-center justify-end transition-colors"
                                >
                                    <GitBranch className="w-3 h-3 mr-1" /> Yêu cầu phụ
                                </button>
                            )}
                            <button
                                onClick={() => confirmCancel(req)}
                                className="text-vin-red hover:text-vin-red/80 text-[10px] font-bold uppercase tracking-wider flex items-center justify-end transition-colors"
                            >
                                <XCircle className="w-3 h-3 mr-1" /> Hủy bỏ
                            </button>
                        </>
                    )}

                    {(req.status === 'cancelled' || req.status === 'rejected' || (req.type === 'Sử dụng CSVC' && req.end_time && new Date() > new Date(req.end_time))) && (
                        <button
                            onClick={() => handleDelete(req.id)}
                            className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase tracking-wider flex items-center justify-end transition-colors"
                        >
                            <Trash2 className="w-3 h-3 mr-1" /> Xóa
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const StudentPage = () => {
    const { requests, addRequest, cancelRequest, deleteRequest } = useRequests();
    const { user } = useAuth();

    // Initial Form State
    const initialForm = {
        type: REQUEST_TYPES[0], // ensure this is valid access
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
    const [notification, setNotification] = useState(null);

    // Remove persistent newlyCreatedId state, replaced by animatingIds
    const [animatingIds, setAnimatingIds] = useState({}); // { [id]: 'blue' | 'green' | 'red' }

    // Track previous requests for status diffing
    const prevRequestsRef = useRef({});

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

    // Status Diffing Effect
    useEffect(() => {
        const newAnimatingIds = { ...animatingIds };
        let hasChanges = false;

        requests.forEach(req => {
            const prevStatus = prevRequestsRef.current[req.id];

            // 1. Detect New Creation (not in prev, but exists now)
            if (prevStatus === undefined) {
                // Initial load or new creation. We skip animation to avoid flash on reload.
            }
            // 2. Detect Status Changes
            else if (prevStatus !== req.status) {
                if (req.status === 'assigned') {
                    newAnimatingIds[req.id] = 'green';
                    hasChanges = true;
                    // Auto-clear after 1.5s
                    setTimeout(() => {
                        setAnimatingIds(prev => {
                            const next = { ...prev };
                            delete next[req.id];
                            return next;
                        });
                    }, 1500);
                } else if (req.status === 'rejected') {
                    newAnimatingIds[req.id] = 'red';
                    hasChanges = true;
                    // Auto-clear after 1.5s
                    setTimeout(() => {
                        setAnimatingIds(prev => {
                            const next = { ...prev };
                            delete next[req.id];
                            return next;
                        });
                    }, 1500);
                } else if (req.status === 'completed') {
                    newAnimatingIds[req.id] = 'green';
                    hasChanges = true;
                    // Auto-clear after 1.5s
                    setTimeout(() => {
                        setAnimatingIds(prev => {
                            const next = { ...prev };
                            delete next[req.id];
                            return next;
                        });
                    }, 1500);
                }
            }
        });

        // Update Ref
        requests.forEach(req => {
            prevRequestsRef.current[req.id] = req.status;
        });

        if (hasChanges) {
            // console.log("Updating animatingIds:", newAnimatingIds);
            setAnimatingIds(newAnimatingIds);
        }

    }, [requests]); // animatingIds is read-only here for initialization, not really a dependency for triggering, but keeping it stable is fine.

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

        try {
            const req = await addRequest(payload, parentRequest ? parentRequest.id : null);

            if (req) {
                setSubmittedId(req.id);
                setFormData(initialForm);
                setParentRequest(null);

                // Show Success Popup
                setNotification({
                    type: 'success',
                    message: `Yêu cầu #${req.id} đã được gửi thành công.`
                });

                setActiveTab('track'); // Switch to track tab
                window.scrollTo({ top: 0, behavior: 'smooth' });

                setActiveTab('track'); // Switch to track tab
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Trigger Blue Animation for New Request
                setAnimatingIds(prev => ({ ...prev, [req.id]: 'blue' }));
                setTimeout(() => {
                    setAnimatingIds(prev => {
                        const next = { ...prev };
                        delete next[req.id];
                        return next;
                    });
                }, 1500);

            } else {
                setNotification({
                    type: 'error',
                    message: "Không thể tạo yêu cầu. Vui lòng thử lại."
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: "Đã xảy ra lỗi hệ thống."
            });
            console.error(error);
        }
    };

    // Initialize form with current date
    useEffect(() => {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        if (!formData.start_time && !formData.end_time && !parentRequest) {
            setFormData(prev => ({
                ...prev,
                start_time: now.toISOString(),
                end_time: oneHourLater.toISOString()
            }));
        }
    }, [parentRequest]); // Reset when checking parent or on mount

    const initiateSubRequest = (parent) => {
        setParentRequest(parent);
        setFormData({
            ...initialForm,
            type: parent.type, // Sync type from parent
            location: parent.location || '', // Sync Location
            start_time: parent.start_time || new Date().toISOString(), // Sync Time
            end_time: parent.end_time || new Date(new Date().getTime() + 3600000).toISOString() // Sync Time
        });
        setSubmittedId(null); // Clear any previous success message
        setActiveTab('send'); // Switch to send tab
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmCancel = (req) => {
        setRequestToCancel(req);
        setIsCancelModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa yêu cầu này? Nếu đây là yêu cầu chính, toàn bộ yêu cầu phụ cũng sẽ bị xóa.")) {
            const success = await deleteRequest(id);
            if (success) {
                setNotification({
                    type: 'success',
                    message: "Yêu cầu đã được xóa thành công."
                });
            } else {
                setNotification({
                    type: 'error',
                    message: "Không thể xóa yêu cầu. Vui lòng thử lại."
                });
            }
        }
    };

    const handleCancel = async () => {
        if (requestToCancel) {
            await cancelRequest(requestToCancel.id);
            setIsCancelModalOpen(false);
            setRequestToCancel(null);
        }
    };

    const getTypeBadgeColor = (type) => {
        if (type === "Sử dụng CSVC") return "bg-vin-blue/10 text-vin-blue border border-vin-blue/20";
        if (type === "Khác") return "bg-gray-100 text-gray-600 border border-gray-200";
        if (type?.includes("child")) return "bg-purple-100 text-purple-800 border border-purple-200";
        return "bg-slate-100 text-slate-700 border border-slate-200";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            case 'assigned': return 'bg-vin-blue/10 text-vin-blue border border-vin-blue/20';
            case 'completed': return 'bg-green-50 text-green-700 border border-green-200';
            case 'rejected': return 'bg-vin-red/10 text-vin-red border border-vin-red/20';
            case 'cancelled': return 'bg-gray-100 text-gray-400 border border-gray-200';
            default: return 'bg-gray-50 text-gray-500 border border-gray-200';
        }
    };


    return (
        <div className="space-y-6">
            <NotificationPopup notification={notification} onClose={() => setNotification(null)} />
            {/* Tabs Navigation*/}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-vin-blue/10 pb-6">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="w-1.5 h-10 bg-vin-red"></div>
                    <div>
                        <h2 className="text-3xl font-bold text-vin-blue uppercase tracking-tight">Student Service Portal</h2>
                    </div>
                </div>

                <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-none scale-[0.9] origin-right">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`
                            flex items-center px-6 py-2.5 rounded-none text-[11px] font-bold uppercase tracking-widest transition-all
                            ${activeTab === 'send'
                                ? 'bg-vin-blue text-white'
                                : 'text-gray-500 hover:bg-gray-100'}
                        `}
                    >
                        <Send className="w-3.5 h-3.5 mr-2" />
                        Gửi Yêu Cầu
                    </button>
                    <button
                        onClick={() => setActiveTab('track')}
                        className={`
                            flex items-center px-6 py-2.5 rounded-none text-[11px] font-bold uppercase tracking-widest transition-all
                            ${activeTab === 'track'
                                ? 'bg-vin-blue text-white'
                                : 'text-gray-500 hover:bg-gray-100'}
                        `}
                    >
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        Đang xử lý
                    </button>
                </div>
            </div>

            {/* Tab 1: Send Request */}
            {activeTab === 'send' && (
                <div className={`max-w-3xl mx-auto transition-all ${parentRequest ? 'border-2 border-purple-200' : ''}`}>
                    <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
                        <div className={`${parentRequest ? 'bg-purple-700' : 'bg-vin-blue'} px-8 py-5 transition-colors relative`}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-vin-red"></div>
                            <h2 className="text-lg font-bold text-white flex items-center uppercase tracking-widest">
                                {parentRequest ? <GitBranch className="w-5 h-5 mr-3" /> : <Send className="w-5 h-5 mr-3" />}
                                {parentRequest ? `Yêu cầu phụ cho #${parentRequest.id}` : 'Gửi Yêu Cầu Hỗ Trợ'}
                            </h2>
                        </div>

                        <div className="p-6">
                            {validationError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {validationError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Loại yêu cầu</label>
                                    {parentRequest ? (
                                        <div className="w-full rounded-none border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-semibold text-vin-blue">
                                            {formData.type}
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full rounded-none border-gray-200 shadow-sm focus:border-vin-blue focus:ring-1 focus:ring-vin-blue py-3 px-4 border bg-white text-sm font-medium transition-all"
                                        >
                                            {REQUEST_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {formData.type === "Sử dụng CSVC" && (
                                    <div className="col-span-1 border-l-4 border-vin-blue bg-vin-blue/5 p-5 animate-fade-in">
                                        <div className="text-[11px] font-bold text-vin-blue uppercase tracking-widest flex items-center mb-4 border-b border-vin-blue/10 pb-2">
                                            <Clock className="w-3.5 h-3.5 mr-2" />
                                            Yêu cầu đặt lịch
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <VinDatePicker
                                                    label="BẮT ĐẦU TỪ"
                                                    value={formData.start_time}
                                                    onChange={(val) => setFormData({ ...formData, start_time: val })}
                                                />
                                            </div>
                                            <div>
                                                <VinDatePicker
                                                    label="KẾT THÚC LÚC"
                                                    value={formData.end_time}
                                                    onChange={(val) => setFormData({ ...formData, end_time: val })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center">
                                        Địa điểm (Phòng, Khu vực)
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="ĐỊA ĐIỂM (PHÒNG HỌC, SẢNH...)"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            disabled={!!parentRequest} // Lock if sub-request
                                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-none focus:ring-1 focus:ring-vin-blue focus:border-vin-blue text-[11px] font-bold uppercase tracking-widest placeholder:text-gray-300 transition-all ${parentRequest ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center">
                                        <FileText className="w-3.5 h-3.5 mr-2 text-vin-blue" />
                                        Mô tả chi tiết
                                        <span className="ml-auto text-[9px] font-bold text-gray-300">
                                            Tối đa {formData.type === "Khác" ? 500 : 200} kí tự
                                        </span>
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Mô tả sự cố hoặc yêu cầu cụ thể..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full rounded-none border-gray-200 shadow-sm focus:border-vin-blue focus:ring-1 focus:ring-vin-blue py-3 px-4 border text-sm font-medium transition-all placeholder:text-gray-300"
                                    />
                                    <div className="text-right text-[10px] font-bold text-vin-blue mt-1.5 tracking-widest">
                                        {formData.description.length} / {formData.type === "Khác" ? 500 : 200}
                                    </div>
                                </div>

                                <div className="flex space-x-4 pt-2">
                                    {parentRequest && (
                                        <button
                                            type="button"
                                            onClick={() => setParentRequest(null)}
                                            className="flex-1 py-4 px-4 border-2 border-gray-200 rounded-none text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                                        >
                                            Hủy tạo con
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className={`flex-1 flex justify-center py-4 px-4 border border-transparent rounded-none text-[11px] font-bold uppercase tracking-widest text-white transition-all shadow-md active:translate-y-0.5 ${parentRequest ? 'bg-purple-700 hover:bg-purple-800' : 'bg-vin-blue hover:bg-[#0d3b6b]'}`}
                                    >
                                        Gửi yêu cầu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Track Requests */}
            {activeTab === 'track' && (
                <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-8 py-5 border-b-2 border-gray-50 bg-white flex justify-between items-center relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-vin-blue"></div>
                        <h3 className="text-lg font-bold text-vin-blue uppercase tracking-widest">Danh sách yêu cầu</h3>
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
                                                <RequestItem
                                                    req={group}
                                                    animatingIds={animatingIds}
                                                    initiateSubRequest={initiateSubRequest}
                                                    confirmCancel={confirmCancel}
                                                    handleDelete={handleDelete}
                                                    getTypeBadgeColor={getTypeBadgeColor}
                                                    getStatusColor={getStatusColor}
                                                />

                                                {/* Child Requests */}
                                                {hasChildren && (
                                                    <div className="ml-4 border-l-2 border-gray-100 pl-2 pb-2">
                                                        {childrenToShow.map(child => (
                                                            <RequestItem
                                                                key={child.id}
                                                                req={child}
                                                                isChild={true}
                                                                animatingIds={animatingIds}
                                                                initiateSubRequest={initiateSubRequest}
                                                                confirmCancel={confirmCancel}
                                                                handleDelete={handleDelete}
                                                                getTypeBadgeColor={getTypeBadgeColor}
                                                                getStatusColor={getStatusColor}
                                                            />
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
            <CancelRequestModal
                isOpen={isCancelModalOpen}
                request={requestToCancel}
                onConfirm={handleCancel}
                onCancel={() => setIsCancelModalOpen(false)}
            />
        </div>
    );
};

export default StudentPage;
