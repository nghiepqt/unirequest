import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {trend && (
                    <div className={`flex items-center text-xs mt-2 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                        {trend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> :
                            trend < 0 ? <ArrowDown className="w-3 h-3 mr-1" /> :
                                <Minus className="w-3 h-3 mr-1" />}
                        <span className="font-medium">{Math.abs(trend)}%</span>
                        <span className="ml-1 text-gray-400">so với tuần trước</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    );
};

export default StatsCard;
