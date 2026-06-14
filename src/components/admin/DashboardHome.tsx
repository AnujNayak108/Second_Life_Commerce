import { 
  BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line, 
  PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  RotateCcw, Shield, Trash2, Gift, Coins, Leaf, Trash, TrendingUp, TrendingDown 
} from 'lucide-react';
import { 
  RETURN_DISTRIBUTION, MONTHLY_RETURNS, CATEGORY_DISTRIBUTION, SUSTAINABILITY_HISTORY 
} from './mockData';

interface DashboardHomeProps {
  onNavigate: (view: string) => void;
  liveStats?: { totalReturns: number; soldCount: number; greenCoins: number };
}

export function DashboardHome({ onNavigate, liveStats }: DashboardHomeProps) {
  // KPI Data â€” merge live stats with static data
  const totalReturns = (liveStats?.totalReturns || 0) + 245;
  const resoldProducts = (liveStats?.soldCount || 0) + 180;
  const totalCoins = (liveStats?.greenCoins || 0) + 5400;

  const kpis = [
    { title: 'Total Returns', value: totalReturns.toString(), change: '+12.4%', up: true, icon: RotateCcw, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', view: 'returns-pending' },
    { title: 'Resold Products', value: resoldProducts.toString(), change: '+18.2%', up: true, icon: Leaf, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', view: 'marketplace' },
    { title: 'Refurbished Products', value: '40', change: '+4.5%', up: true, icon: Shield, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', view: 'marketplace' },
    { title: 'Recycled Products', value: '15', change: '-2.3%', up: false, icon: Trash2, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', view: 'analytics-sustainability' },
    { title: 'Donated Products', value: '10', change: '0.0%', up: true, icon: Gift, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', view: 'analytics-sustainability' },
    { title: 'Eco Credits Issued', value: totalCoins.toLocaleString(), change: '+24.1%', up: true, icon: Coins, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', view: 'eco-credits' },
    { title: 'COâ‚‚ Saved', value: `${250 + (liveStats?.soldCount || 0) * 8} kg`, change: '+15.8%', up: true, icon: Leaf, color: 'text-green-500 bg-green-500/10 border-green-500/20', view: 'analytics-sustainability' },
    { title: 'Waste Diverted', value: `${120 + (liveStats?.soldCount || 0) * 3} kg`, change: '+8.9%', up: true, icon: Trash, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20', view: 'analytics-sustainability' },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Facility Operations Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Warehouse facility BLR-03 circular workflows & analytics overview.</p>
        </div>
        <button 
          onClick={() => onNavigate('returns-pending')}
          className="px-4 py-2 bg-[#FF9900] hover:bg-[#E08800] text-gray-900 font-bold rounded shadow transition-colors text-sm"
        >
          View Pending Returns
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <div 
              key={index} 
              onClick={() => onNavigate(kpi.view)}
              className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md hover:border-[#FF9900]/40 dark:hover:border-[#FF9900]/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF9900]/2 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{kpi.title}</span>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{kpi.value}</div>
                </div>
                <div className={`p-2.5 rounded-lg border ${kpi.color} shrink-0`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-xs font-medium">
                {kpi.up ? (
                  <span className="text-emerald-600 dark:text-emerald-500 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {kpi.change}
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-500 flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {kpi.change}
                  </span>
                )}
                <span className="text-gray-400 dark:text-gray-500">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Return Distribution Pie Chart */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Return Routing Distribution</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total lifecycle paths chosen for returned stock.</p>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <RechartsPieChart>
                <Pie
                  data={RETURN_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {RETURN_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', color: '#fff', border: 'none', borderRadius: '4px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} iconType="circle" />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Returns Line Chart */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Monthly Returns Intake</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aggregated count of returned units processed over the last 6 months.</p>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <RechartsLineChart data={MONTHLY_RETURNS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#19222D', border: '1px solid #374151', color: '#fff' }} />
                <Line type="monotone" dataKey="returns" stroke="#FF9900" strokeWidth={3} dot={{ fill: '#FF9900', r: 4 }} activeDot={{ r: 6 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sustainability Impact Bar Chart */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Eco Impact History</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Carbon offset and waste reduction trends (cumulative scale).</p>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <RechartsBarChart data={SUSTAINABILITY_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#19222D', border: '1px solid #374151', color: '#fff' }} />
                <Legend />
                <Bar dataKey="co2" name="COâ‚‚ Saved (kg)" fill="#007600" radius={[4, 4, 0, 0]} />
                <Bar dataKey="waste" name="Waste Diverted (kg)" fill="#007185" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Category Return Analysis Chart */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Returns by Category</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Percentage distribution of customer returns across shopping categories.</p>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <RechartsPieChart>
                <Pie
                  data={CATEGORY_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {CATEGORY_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#19222D', border: '1px solid #374151', color: '#fff' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
