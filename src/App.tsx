import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  Plus, 
  Settings, 
  History,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  LogOut,
  User,
  LayoutDashboard,
  BarChart3,
  PieChart as PieChartIcon,
  ChevronRight,
  Lock,
  Mail
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Stats {
  initialCapital: number;
  totalProfit: number;
  currentCapital: number;
  monthlyProfit: number;
  dailyProfit: number;
}

interface HistoryEntry {
  id: number;
  date: string;
  amount: number;
  note: string;
}

interface UserData {
  id: number;
  username: string;
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newInitialCapital, setNewInitialCapital] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        fetchData();
      } else if (res.status !== 401) {
        console.error('Auth check failed with status:', res.status);
      }
    } catch (error) {
      console.error('Network error during auth check');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/history')
      ]);
      if (statsRes.ok && historyRes.ok) {
        const statsData = await statsRes.json();
        const historyData = await historyRes.json();
        setStats(statsData);
        setHistory(historyData);
        setNewInitialCapital(statsData.initialCapital.toString());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      if (res.ok) {
        checkAuth();
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (error) {
      setAuthError('Connection error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setStats(null);
    setHistory([]);
  };

  const handleSubmitProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      const res = await fetch('/api/profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), note })
      });
      if (res.ok) {
        setAmount('');
        setNote('');
        fetchData();
      }
    } catch (error) {
      console.error('Error submitting profit:', error);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialCapital: parseFloat(newInitialCapital) })
      });
      if (res.ok) {
        setIsSettingsOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white font-mono text-sm tracking-[0.2em]"
        >
          INITIALIZING_CORE_SYSTEM...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-2xl shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <TrendingUp className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/40 text-sm mt-2">
              {authMode === 'login' ? 'Enter your credentials to access your terminal' : 'Join the elite trading network'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="johndoe"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {authError && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-500 text-xs text-center"
              >
                {authError}
              </motion.p>
            )}

            <button 
              type="submit"
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors mt-4"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-white/40 text-xs hover:text-white transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const chartData = [...history].reverse().map(entry => ({
    date: entry.date.slice(5),
    profit: entry.amount
  }));

  const winCount = history.filter(h => h.amount > 0).length;
  const lossCount = history.filter(h => h.amount < 0).length;
  const pieData = [
    { name: 'Wins', value: winCount, color: '#10b981' },
    { name: 'Losses', value: lossCount, color: '#f43f5e' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 border-r border-white/5 flex flex-col items-center md:items-stretch p-4 md:p-6 bg-[#0d0d0d]">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="text-black" size={24} />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight">TRADEX</span>
        </div>

        <nav className="flex-grow space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem icon={<History size={20} />} label="History" />
          <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => setIsSettingsOpen(true)} />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Pro Trader</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2 py-3 text-white/40 hover:text-rose-500 transition-colors group"
          >
            <LogOut size={20} />
            <span className="hidden md:block text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-4 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Terminal Overview</h2>
            <p className="text-white/40 text-sm mt-1">Welcome back, {user.username}. Here's your performance summary.</p>
          </div>
          <button 
            onClick={() => {}} // Could open a quick add modal
            className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors"
          >
            <Plus size={18} />
            New Entry
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ModernStatCard 
            label="Current Capital" 
            value={stats?.currentCapital || 0} 
            subValue={`Initial: $${stats?.initialCapital}`}
            icon={<Wallet className="text-blue-400" size={20} />}
          />
          <ModernStatCard 
            label="Total P/L" 
            value={stats?.totalProfit || 0} 
            percentage={stats?.initialCapital ? (stats.totalProfit / stats.initialCapital) * 100 : 0}
            icon={<TrendingUp className="text-emerald-400" size={20} />}
          />
          <ModernStatCard 
            label="Monthly P/L" 
            value={stats?.monthlyProfit || 0} 
            percentage={stats?.initialCapital ? (stats.monthlyProfit / stats.initialCapital) * 100 : 0}
            icon={<Calendar className="text-purple-400" size={20} />}
          />
          <ModernStatCard 
            label="Today's P/L" 
            value={stats?.dailyProfit || 0} 
            percentage={stats?.initialCapital ? (stats.dailyProfit / stats.initialCapital) * 100 : 0}
            icon={<History className="text-orange-400" size={20} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-lg">Growth Analysis</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/40">7 Days</span>
                  <span className="px-3 py-1 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-wider">30 Days</span>
                </div>
              </div>
              <div className="h-[350px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#ffffff40' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#ffffff40' }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#fff" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorProfit)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/20 italic text-sm">
                    No data available for visualization
                  </div>
                )}
              </div>
            </div>

            {/* Quick Entry Form */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-6">Quick Log</h3>
              <form onSubmit={handleSubmitProfit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Note</label>
                  <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Pair, Strategy..."
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-white/90 transition-colors"
                  >
                    Log Trade
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Distribution & History */}
          <div className="space-y-8">
            {/* Win/Loss Pie */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-6">Performance Ratio</h3>
              <div className="h-[200px]">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/20 italic text-sm">
                    No data
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-8 mt-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-white/40">Wins</p>
                  <p className="text-xl font-bold text-emerald-500">{winCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-white/40">Losses</p>
                  <p className="text-xl font-bold text-rose-500">{lossCount}</p>
                </div>
              </div>
            </div>

            {/* Recent History List */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Recent Logs</h3>
                <button className="text-white/40 hover:text-white transition-colors">
                  <History size={18} />
                </button>
              </div>
              <div className="space-y-4">
                {history.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5",
                        entry.amount >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {entry.amount >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate max-w-[100px]">{entry.note || 'Trade Entry'}</p>
                        <p className="text-[10px] text-white/40">{entry.date}</p>
                      </div>
                    </div>
                    <p className={cn(
                      "font-mono font-bold",
                      entry.amount >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {entry.amount >= 0 ? '+' : ''}{entry.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-center text-white/20 italic text-sm py-4">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Initial Capital ($)</label>
                  <input 
                    type="number" 
                    value={newInitialCapital}
                    onChange={(e) => setNewInitialCapital(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white/30"
                    required
                  />
                  <p className="text-[10px] text-white/30 italic">Adjust your starting balance for ROI calculations.</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex-1 border border-white/10 py-3 rounded-xl font-bold text-sm hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
        active ? "bg-white text-black" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden md:block text-sm font-bold">{label}</span>
      {active && <ChevronRight className="hidden md:block ml-auto" size={16} />}
    </button>
  );
}

function ModernStatCard({ label, value, icon, subValue, percentage }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  subValue?: string;
  percentage?: number;
}) {
  return (
    <div className="bg-[#111] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
          {icon}
        </div>
        {percentage !== undefined && (
          <div className={cn(
            "px-2 py-1 rounded-lg text-[10px] font-bold font-mono",
            percentage >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
          )}>
            {percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">{label}</p>
        <h4 className="text-2xl font-bold tracking-tight">
          {value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </h4>
        {subValue && <p className="text-[10px] text-white/20 mt-1 font-mono">{subValue}</p>}
      </div>
      
      {/* Subtle background glow on hover */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all duration-500" />
    </div>
  );
}


