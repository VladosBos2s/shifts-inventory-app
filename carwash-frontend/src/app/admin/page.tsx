'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, CreditCard, Banknote 
} from 'lucide-react';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. check tokens and user role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/revenue'); 
      
      setAnalytics({
        totalRevenue: res.data.allTime.total,     
        cashRevenue: res.data.today.cash,         
        cardRevenue: res.data.today.card,         
        todayTotal: res.data.today.total,         
        chartData: [
          { name: 'Today', revenue: res.data.today.total },
          { name: 'All Time', revenue: res.data.allTime.total },
        ]
      });
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#10b981'];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-slate-400 text-sm">Real-time car wash performance metrics and revenue analytics</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-400">
          Role: <span className="text-indigo-400 font-semibold">Administrator</span>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold">${analytics?.totalRevenue || 0}</div>
          <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">↑ +12.5% from last week</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cash Payments</span>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400"><Banknote className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold">${analytics?.cashRevenue || 0}</div>
          <p className="text-slate-400 text-xs mt-2">Physical register cash</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Card Payments</span>
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400"><CreditCard className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold">${analytics?.cardRevenue || 0}</div>
          <p className="text-slate-400 text-xs mt-2">Terminal / Stripe payments</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-base font-semibold mb-6">Weekly Revenue Performance ($)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.chartData || []}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold mb-2">Payment Breakdown</h3>
            <p className="text-slate-400 text-xs mb-4">Ratio between cash and electronic cards</p>
          </div>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Card', value: analytics?.cardRevenue || 76 },
                    { name: 'Cash', value: analytics?.cashRevenue || 24 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs text-slate-400 mt-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Card</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Cash</div>
          </div>
        </div>
      </div>
    </div>
  );
}