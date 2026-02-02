import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

const DashboardCharts = ({ requests }) => {

    // 1. Data for Requests by Type (Bar Chart)
    const typeData = useMemo(() => {
        const counts = {};
        requests.forEach(req => {
            const type = req.type || 'Khác';
            counts[type] = (counts[type] || 0) + 1;
        });

        return Object.keys(counts).map(type => ({
            name: type,
            count: counts[type]
        })).sort((a, b) => b.count - a.count);
    }, [requests]);

    // 2. Data for Weekly Trend (Line Chart - Last 7 Days)
    const trendData = useMemo(() => {
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'dd/MM');

            const count = requests.filter(req => {
                if (!req.created_at) return false;
                try {
                    return isSameDay(parseISO(req.created_at), date);
                } catch (e) { return false; }
            }).length;

            data.push({
                name: dateStr,
                requests: count
            });
        }
        return data;
    }, [requests]);

    return (
        <div className="space-y-8 mb-8">
            {/* Chart 1: Requests by Type (Horizontal Bar) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Phân Loại Yêu Cầu (Theo Loại)</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={typeData}
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                tick={{ fontSize: 13, fontWeight: 500 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#3b82f6"
                                radius={[0, 4, 4, 0]}
                                name="Số lượng"
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: Weekly Trend (Line Chart) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Xu Hướng Gửi Yêu Cầu (7 Ngày Qua)</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 13 }} padding={{ left: 20, right: 20 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line
                                type="monotone"
                                dataKey="requests"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 7 }}
                                name="Yêu cầu mới"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
