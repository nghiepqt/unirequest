import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const VinDatePicker = ({ value, onChange, label, placeholder = "CHỌN THỜI GIAN" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    // Parse value or default to now if empty/invalid, but keep null if strictly empty
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

    // Time state (12h format as requested by "0-12" scroll preference)
    const [selectedHour, setSelectedHour] = useState(value ? parseInt(format(new Date(value), 'hh')) : 12);
    const [selectedMinute, setSelectedMinute] = useState(value ? parseInt(format(new Date(value), 'mm')) : 0);
    const [period, setPeriod] = useState(value ? format(new Date(value), 'a') : 'AM');

    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            setSelectedDate(date);
            setSelectedHour(parseInt(format(date, 'hh'))); // 01-12
            setSelectedMinute(parseInt(format(date, 'mm')));
            setPeriod(format(date, 'a'));
        }
    }, [value]);

    const handleDateSelect = (date) => {
        const newDate = new Date(date);
        // Preserve time
        let hours = period === 'PM' && selectedHour !== 12 ? selectedHour + 12 : selectedHour;
        if (period === 'AM' && selectedHour === 12) hours = 0;

        newDate.setHours(hours);
        newDate.setMinutes(selectedMinute);

        setSelectedDate(newDate);
        onChange(newDate.toISOString()); // Standardize output
    };

    const handleTimeChange = (type, val) => {
        let newHour = selectedHour;
        let newMinute = selectedMinute;
        let newPeriod = period;

        if (type === 'hour') {
            newHour = val;
            setSelectedHour(val);
        } else if (type === 'minute') {
            newMinute = val;
            setSelectedMinute(val);
        } else if (type === 'period') {
            newPeriod = val;
            setPeriod(val);
        }

        if (selectedDate) {
            // Update the actual date object
            const newDate = new Date(selectedDate);
            let hours = newPeriod === 'PM' && newHour !== 12 ? newHour + 12 : newHour;
            if (newPeriod === 'AM' && newHour === 12) hours = 0;

            newDate.setHours(hours);
            newDate.setMinutes(newMinute);
            onChange(newDate.toISOString());
        }
    };

    // Calendar Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Generate arrays for dropdowns
    const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
    const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59

    return (
        <div className="relative font-montserrat" ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {label}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between cursor-pointer py-2.5 px-3 border border-gray-200 
                    ${isOpen ? 'border-vin-blue ring-1 ring-vin-blue bg-white' : 'bg-white hover:bg-gray-50'} 
                    transition-all select-none`}
            >
                <div className="flex items-center text-sm font-bold text-vin-dark uppercase">
                    {selectedDate ? (
                        <>
                            <span className="mr-2 text-vin-blue">{format(selectedDate, 'dd/MM/yyyy')}</span>
                            <span className="text-gray-400 mx-1">-</span>
                            <span className="ml-2">{format(selectedDate, 'hh:mm a')}</span>
                        </>
                    ) : (
                        <span className="text-gray-300">{placeholder}</span>
                    )}
                </div>
                <CalendarIcon className="w-4 h-4 text-vin-red" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[300px] z-50 bg-white shadow-xl border border-gray-200 animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-vin-blue text-white p-3 flex justify-between items-center">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded-full">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold uppercase tracking-widest">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded-full">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-3">
                        <div className="grid grid-cols-7 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-[10px] font-bold text-center text-gray-400">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleDateSelect(day)}
                                    className={`
                                        h-8 w-8 text-xs font-medium flex items-center justify-center rounded-none transition-colors
                                        ${!isSameMonth(day, monthStart) ? 'text-gray-300' : 'text-vin-dark'}
                                        ${selectedDate && isSameDay(day, selectedDate) ? 'bg-vin-blue text-white font-bold' : 'hover:bg-gray-100'}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Picker (Dropdown Style to limits infinite scroll) */}
                    <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> Giờ (hh:mm)
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Hours 1-12 */}
                            <select
                                value={selectedHour}
                                onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                className="flex-1 bg-white border border-gray-200 text-sm font-bold p-1 rounded-none focus:border-vin-blue focus:ring-1 focus:ring-vin-blue outline-none"
                            >
                                {hours.map(h => (
                                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                            <span className="text-gray-400">:</span>
                            {/* Minutes 0-59 */}
                            <select
                                value={selectedMinute}
                                onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                className="flex-1 bg-white border border-gray-200 text-sm font-bold p-1 rounded-none focus:border-vin-blue focus:ring-1 focus:ring-vin-blue outline-none"
                            >
                                {minutes.map(m => (
                                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                            {/* AM/PM */}
                            <div className="flex border border-gray-200 bg-white">
                                <button
                                    onClick={() => handleTimeChange('period', 'AM')}
                                    className={`px-2 py-1 text-[10px] font-bold ${period === 'AM' ? 'bg-vin-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    AM
                                </button>
                                <button
                                    onClick={() => handleTimeChange('period', 'PM')}
                                    className={`px-2 py-1 text-[10px] font-bold ${period === 'PM' ? 'bg-vin-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    PM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VinDatePicker;
