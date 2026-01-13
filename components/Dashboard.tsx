
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, RotateCcw, Target } from 'lucide-react';
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
    const totalE = filteredData.expenses.reduce((sum, e) => sum + e.total, 0);
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
      daily[date].expenses += e.total;
    });
    return Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel Financeiro</h2>
          <p className="text-slate-500">Acompanhamento global de faturamento e lucros.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Período</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm border-none focus:ring-0 text-slate-700 font-medium" />
            <span className="text-slate-300">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm border-none focus:ring-0 text-slate-700 font-medium" />
          </div>
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
          <div className="flex gap-1">
            <button onClick={() => setShortcut('today')} className="px-3 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 text-slate-600">Hoje</button>
            <button onClick={() => setShortcut('month')} className="px-3 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 text-slate-600">Mês</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"><RotateCcw size={16} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento</p>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">R$ {stats.totalBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{stats.count} serviços realizados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas</p>
            <TrendingDown size={16} className="text-rose-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Custos operacionais</p>
        </div>

        <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 ${stats.profit >= 0 ? 'border-l-indigo-500' : 'border-l-rose-600'}`}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido</p>
            <DollarSign size={16} className={stats.profit >= 0 ? "text-indigo-500" : "text-rose-600"} />
          </div>
          <h3 className={`text-xl font-black ${stats.profit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            R$ {stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Saldo em caixa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Fluxo de Caixa Diário
          </h4>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')} contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="billing" name="Faturamento" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBilling)" />
                  <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm font-medium">Aguardando dados para o gráfico...</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold mb-6 text-slate-800">Mix de Veículos</h4>
          <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
            {stats.totalBilling > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sizeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {sizeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 w-full md:w-48 mt-4 md:mt-0">
                  {sizeData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                        <span className="text-slate-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm font-medium">Sem dados no mix.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Monitoramento Global</h3>
          <p className="text-slate-400 text-sm">Os dados são sincronizados em tempo real entre todos os acessos.</p>
        </div>
        <p className="text-[10px] font-black tracking-[0.2em] bg-blue-600 px-4 py-2 rounded-full uppercase">
          Lava Rápido Pro — <span className="text-white/80">João Layón</span>
        </p>
      </div>
    </div>
  );
};
