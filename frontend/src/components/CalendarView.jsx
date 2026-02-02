import { useState, useMemo } from 'react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { groupRequests } from '../lib/utils';
import { ChevronLeft, ChevronRight, MapPin, AlertTriangle, User, Info, Clock, CornerDownRight, ChevronDown, MoreHorizontal } from 'lucide-react';

const CalendarView = ({ requests }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const today = () => {
        const now = new Date();
        setCurrentMonth(now);
        setSelectedDate(now);
    };

    // Filter "Usage" requests
    const facilityRequests = useMemo(() => {
        return requests.filter(r =>
            r.type === 'Sử dụng CSVC' &&
            r.status !== 'rejected' &&
            r.status !== 'cancelled'
        );
    }, [requests]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const getRequestsForDay = (day) => {
        return facilityRequests.filter(req => {
            if (!req.created_at) return false;
            try { return isSameDay(parseISO(req.created_at), day); }
            catch (e) { return false; }
        });
    };

    // --- Advanced Conflict Detection Logic ---
    const detectedConflicts = useMemo(() => {
        const conflicts = [];
        const daysRequests = getRequestsForDay(selectedDate);

        // Helper: Check if two requests are related (Parent-Child)
        // They are related if:
        // 1. A is parent of B (B.parent_id == A.id)
        // 2. B is parent of A (A.parent_id == B.id)
        // 3. A and B share same parent (A.parent_id == B.parent_id)
        const isRelated = (r1, r2) => {
            const pid1 = r1.parent_id ? parseInt(r1.parent_id) : null;
            const pid2 = r2.parent_id ? parseInt(r2.parent_id) : null;
            const id1 = parseInt(r1.id);
            const id2 = parseInt(r2.id);

            return (pid1 === id2) || (pid2 === id1) || (pid1 && pid2 && pid1 === pid2);
        };

        // Pairwise check for all requests in the day
        // We iterate unique pairs to find specific conflicts
        for (let i = 0; i < daysRequests.length; i++) {
            for (let j = i + 1; j < daysRequests.length; j++) {
                const r1 = daysRequests[i];
                const r2 = daysRequests[j];

                // 1. Location & Time Overlap Check
                // (Currently checking just Same Day & Same Location string)
                // In production, parse start_time/end_time here.
                const loc1 = r1.location ? r1.location.trim().toLowerCase() : '';
                const loc2 = r2.location ? r2.location.trim().toLowerCase() : '';

                if (loc1 && loc2 && loc1 === loc2) {
                    // Start logic flow requested by User:
                    const user1 = r1.created_by_id;
                    const user2 = r2.created_by_id;

                    if (user1 && user2 && user1 !== user2) {
                        // Case A: Different Users -> HARD CONFLICT
                        conflicts.push({
                            type: 'CRITICAL',
                            message: `Xung đột gay gắt: ${r1.location} có 02 người khác nhau đặt cùng lúc.`,
                            items: [r1, r2]
                        });
                    } else {
                        // Case B: Same User -> Check Hierarchy
                        if (!isRelated(r1, r2)) {
                            // Same User, Same Location, But NOT related -> Double Booking / Mistake
                            conflicts.push({
                                type: 'WARNING',
                                message: `Cảnh báo: User #${user1} đặt trùng địa điểm cho 2 nhóm yêu cầu khác nhau.`,
                                items: [r1, r2]
                            });
                        }
                        // If Related -> It's fine (e.g., Sub-request detailing equipment for same room usage)
                    }
                }
            }
        }

        return conflicts;
    }, [selectedDate, facilityRequests]);

    // Group the daily requests for display
    const dailyGroupedRequests = useMemo(() => {
        const flatRequests = getRequestsForDay(selectedDate);
        return groupRequests(flatRequests);
    }, [selectedDate, facilityRequests]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
            {/* LEFT: Calendar Grid (Master) */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: vi })}
                    </h2>
                    <div className="flex items-center space-x-1">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={today} className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md">Hôm nay</button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500">{day}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 auto-rows-fr flex-1">
                    {calendarDays.map((day) => {
                        const dayRequests = getRequestsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    relative p-2 border-b border-r border-gray-100 cursor-pointer transition-all hover:bg-blue-50
                                    ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'}
                                    ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/20' : ''}
                                `}
                            >
                                <div className={`
                                    text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                                    ${isToday ? 'bg-blue-600 text-white' : ''}
                                `}>
                                    {format(day, 'd')}
                                </div>

                                {/* Density Indicators */}
                                <div className="flex flex-wrap gap-1 content-start h-full pb-4">
                                    {dayRequests.map((_, i) => (
                                        i < 8 && <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    ))}
                                    {dayRequests.length > 8 && <span className="text-[10px] text-gray-400">+</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: Sidebar Details (Detail) */}
            <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        Chi Tiết {format(selectedDate, 'dd/MM/yyyy')}
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* 1. Conflicts Warning */}
                    {detectedConflicts.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Cảnh Báo Xung Đột ({detectedConflicts.length})
                            </h4>
                            {detectedConflicts.map((conflict, idx) => (
                                <div key={idx} className={`border p-3 rounded-lg text-sm ${conflict.type === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                                    <p className={`font-medium mb-1 ${conflict.type === 'CRITICAL' ? 'text-red-800' : 'text-orange-800'}`}>
                                        {conflict.message}
                                    </p>
                                    <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                                        {conflict.items.map(item => (
                                            <li key={item.id} className="truncate">
                                                <span className="font-mono text-gray-600">#{item.id}</span>
                                                <span className="mx-1">-</span>
                                                User <span className="font-bold">#{item.created_by_id}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2. Request List (Grouped) */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                            <Info className="w-3 h-3 mr-1" />
                            Yêu Cầu Sử Dụng ({getRequestsForDay(selectedDate).length})
                        </h4>

                        {dailyGroupedRequests.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-4">Không có yêu cầu nào.</p>
                        ) : (
                            <div className="space-y-3">
                                {dailyGroupedRequests.map(group => {
                                    const isExpanded = expandedGroups[group.id];
                                    const hasChildren = group.children && group.children.length > 0;
                                    const hasMultipleChildren = group.children && group.children.length > 1;

                                    // If expanded => show all. 
                                    // If collapsed => show 1 (if exists).
                                    const childrenToShow = isExpanded
                                        ? group.children
                                        : (hasChildren ? [group.children[0]] : []);

                                    const hiddenChildrenCount = hasChildren ? group.children.length - childrenToShow.length : 0;

                                    return (
                                        <div key={group.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md">
                                            <div className="flex">
                                                {/* Toggle Button */}
                                                <div className="pt-3 pl-2">
                                                    {hasMultipleChildren ? (
                                                        <button
                                                            onClick={() => toggleGroup(group.id)}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                        </button>
                                                    ) : <div className="w-6"></div>}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1">
                                                    {/* Parent */}
                                                    <div className="p-3 hover:bg-gray-50 transition-colors">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-mono text-xs text-blue-600 font-medium">#{group.id}</span>
                                                            {group.created_by_id && (
                                                                <span className="text-xs text-gray-400 flex items-center">
                                                                    <User className="w-3 h-3 mr-0.5" />{group.created_by_id}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-semibold text-gray-800 mb-1 flex items-center">
                                                            <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                                                            {group.location}
                                                        </div>
                                                        {/* Time Display */}
                                                        {group.start_time && group.end_time && (
                                                            <div className="text-xs text-blue-800 bg-blue-50 px-2 py-1 rounded mb-1 inline-flex items-center">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {format(parseISO(group.start_time), 'HH:mm')} - {format(parseISO(group.end_time), 'HH:mm')}
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-gray-600 line-clamp-2">{group.description}</p>
                                                    </div>

                                                    {/* Children */}
                                                    {hasChildren && (
                                                        <div className="bg-gray-50 border-t border-gray-100 p-2 space-y-2">
                                                            {/* Ellipsis Warning for Collapsed */}
                                                            {!isExpanded && hiddenChildrenCount > 0 && (
                                                                <div
                                                                    onClick={() => toggleGroup(group.id)}
                                                                    className="flex items-center text-[10px] text-gray-500 font-medium cursor-pointer hover:text-blue-600 px-2"
                                                                >
                                                                    <MoreHorizontal className="w-3 h-3 mr-1" />
                                                                    Xem thêm {hiddenChildrenCount} yêu cầu phụ...
                                                                </div>
                                                            )}

                                                            {childrenToShow.map(child => (
                                                                <div key={child.id} className="pl-2 border-l-2 border-blue-200 ml-1">
                                                                    <div className="flex items-center text-xs text-gray-500 mb-0.5">
                                                                        <CornerDownRight className="w-3 h-3 mr-1" />
                                                                        <span className="font-mono">#{child.id}</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-700 font-medium truncate">{child.description}</p>
                                                                    <div className="flex items-center justify-between mt-1">
                                                                        <div className="flex items-center text-[10px] text-gray-400">
                                                                            <MapPin className="w-2.5 h-2.5 mr-0.5" /> {child.location}
                                                                        </div>
                                                                        {child.start_time && child.end_time && (
                                                                            <div className="text-[10px] text-blue-600 font-medium">
                                                                                {format(parseISO(child.start_time), 'HH:mm')} - {format(parseISO(child.end_time), 'HH:mm')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
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
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
