
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, RotateCcw, Activity } from 'lucide-react';
import { Billing, Expense, CarSize } from '../types';

interface DashboardProps {
  billings: Billing[];
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ billings, expenses }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filteredBillings = billings.filter(b => {
      const d = new Date(b.date);
      return (!start || d >= start) && (!end || d <= end);
    });

    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return (!start || d >= start) && (!end || d <= end);
    });

    return { billings: filteredBillings, expenses: filteredExpenses };
  }, [billings, expenses, startDate, endDate]);

  const stats = useMemo(() => {
    const totalB = filteredData.billings.reduce((sum, b) => sum + b.value, 0);
    const totalE = filteredData.expenses.reduce((sum, e) => sum + e.value, 0);
    const count = filteredData.billings.length;
    return {
      totalBilling: totalB,
      totalExpenses: totalE,
      profit: totalB - totalE,
      count
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const daily: Record<string, { date: string; billing: number; expenses: number }> = {};
    filteredData.billings.forEach(b => {
      const date = b.date.split('T')[0];
      if (!daily[date]) daily[date] = { date, billing: 0, expenses: 0 };
      daily[date].billing += b.value;
    });
    filteredData.expenses.forEach(e => {
      const date = e.date.split('T')[0];
      if (!daily[date]) daily[date] = { date, billing: 0, expenses: 0 };
      daily[date].expenses += e.value;
    });
    return Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)).slice(-7); // Mostra últimos 7 dias ativos no mobile
  }, [filteredData]);

  const sizeData = useMemo(() => {
    const counts = { [CarSize.SMALL]: 0, [CarSize.MEDIUM]: 0, [CarSize.LARGE]: 0 };
    filteredData.billings.forEach(b => counts[b.size]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  const setShortcut = (type: 'today' | 'week' | 'month') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (type === 'today') { setStartDate(today); setEndDate(today); }
    else if (type === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (type === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel Geral</h2>
          <p className="text-sm text-slate-500 font-medium">Resumo do seu negócio em tempo real.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
          <div className="flex items-center px-2 py-1 gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setShortcut('today')} className="whitespace-nowrap px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100">Hoje</button>
            <button onClick={() => setShortcut('month')} className="whitespace-nowrap px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100">Mês</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg bg-slate-50"><RotateCcw size={14} /></button>
          </div>
          <div className="h-px md:h-6 w-full md:w-px bg-slate-100"></div>
          <div className="flex items-center gap-2 p-1">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-xs border-none bg-slate-50 rounded-lg p-2 font-bold text-slate-700" />
            <span className="text-slate-300">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-xs border-none bg-slate-50 rounded-lg p-2 font-bold text-slate-700" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-center z-10">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Faturamento</p>
             <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp size={18} /></div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 z-10">R$ {stats.totalBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-emerald-900"><TrendingUp size={120} /></div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-center z-10">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Despesas</p>
             <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><TrendingDown size={18} /></div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 z-10">R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-rose-900"><TrendingDown size={120} /></div>
        </div>

        <div className={`p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden sm:col-span-2 lg:col-span-1 ${stats.profit >= 0 ? 'bg-white' : 'bg-rose-50/50 border-rose-100'}`}>
          <div className="flex justify-between items-center z-10">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lucro Líquido</p>
             <div className={`p-2 rounded-xl ${stats.profit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-100 text-rose-700'}`}><DollarSign size={18} /></div>
          </div>
          <h3 className={`text-2xl font-black z-10 ${stats.profit >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
            R$ {stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-blue-900"><Activity size={120} /></div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="text-sm font-black mb-6 text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Fluxo Diário
          </h4>
          <div className="h-[250px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }} />
                  <Area type="monotone" dataKey="billing" name="Vendas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBilling)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">Sem dados no período</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="text-sm font-black mb-6 text-slate-800 uppercase tracking-widest flex items-center gap-2">
            Mix de Veículos
          </h4>
          <div className="h-[250px] w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            {stats.totalBilling > 0 ? (
              <>
                <div className="flex-1 w-full max-w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sizeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {sizeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-40">
                  {sizeData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-[11px] font-black uppercase tracking-tight p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                        <span className="text-slate-500">{item.name}</span>
                      </div>
                      <span className="text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">Aguardando serviços...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
