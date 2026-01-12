
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, RotateCcw } from 'lucide-react';
import { Billing, Expense, CarSize } from '../types';

interface DashboardProps {
  billings: Billing[];
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ billings, expenses }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtra os dados com base nas datas selecionadas
  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // Ajustar o fim do dia para abranger todo o dia selecionado
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
    return {
      totalBilling: totalB,
      totalExpenses: totalE,
      profit: totalB - totalE
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
    const counts = {
      [CarSize.SMALL]: 0,
      [CarSize.MEDIUM]: 0,
      [CarSize.LARGE]: 0,
    };
    filteredData.billings.forEach(b => counts[b.size]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  const setShortcut = (type: 'today' | 'week' | 'month') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'week') {
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
          <p className="text-slate-500">Filtrando resultados por período personalizado.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase">De</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border-none focus:ring-0 text-slate-700 font-medium" 
            />
          </div>
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Até</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border-none focus:ring-0 text-slate-700 font-medium" 
            />
          </div>
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
          <div className="flex gap-1">
            <button onClick={() => setShortcut('today')} className="px-3 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">Hoje</button>
            <button onClick={() => setShortcut('week')} className="px-3 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">7D</button>
            <button onClick={() => setShortcut('month')} className="px-3 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">Mês</button>
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              title="Limpar Filtros"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Faturamento no Período</p>
            <h3 className="text-2xl font-bold text-slate-900">R$ {stats.totalBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Despesas no Período</p>
            <h3 className="text-2xl font-bold text-slate-900">R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Lucro Líquido</p>
            <h3 className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              R$ {stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Evolução Financeira Diária
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
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="billing" name="Faturamento" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBilling)" />
                  <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Filter size={40} className="mb-2 opacity-20" />
                <p>Nenhum dado no período selecionado.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold mb-6 text-slate-800">Serviços por Porte</h4>
          <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
            {stats.totalBilling > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sizeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 w-full md:w-48 mt-4 md:mt-0">
                  {sizeData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center justify-center text-slate-400">
                <p>Sem dados de veículos.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-bold">Relatórios Precisos</h3>
          <p className="text-blue-100 opacity-90">Os dados acima refletem exatamente o período filtrado.</p>
        </div>
        <p className="text-sm font-medium bg-blue-500/50 px-4 py-2 rounded-full backdrop-blur-sm">
          Sistema desenvolvido por <span className="font-bold">João Layón</span>
        </p>
      </div>
    </div>
  );
};
