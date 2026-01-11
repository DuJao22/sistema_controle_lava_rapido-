
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { Billing, Expense, CarSize } from '../types';

interface DashboardProps {
  billings: Billing[];
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ billings, expenses }) => {
  const [dateRange, setDateRange] = useState('all');

  const stats = useMemo(() => {
    const totalB = billings.reduce((sum, b) => sum + b.value, 0);
    const totalE = expenses.reduce((sum, e) => sum + e.total, 0);
    return {
      totalBilling: totalB,
      totalExpenses: totalE,
      profit: totalB - totalE
    };
  }, [billings, expenses]);

  const chartData = useMemo(() => {
    const daily: Record<string, { date: string; billing: number; expenses: number }> = {};
    
    billings.forEach(b => {
      const date = b.date.split('T')[0];
      if (!daily[date]) daily[date] = { date, billing: 0, expenses: 0 };
      daily[date].billing += b.value;
    });

    expenses.forEach(e => {
      const date = e.date.split('T')[0];
      if (!daily[date]) daily[date] = { date, billing: 0, expenses: 0 };
      daily[date].expenses += e.total;
    });

    return Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
  }, [billings, expenses]);

  const sizeData = useMemo(() => {
    const counts = {
      [CarSize.SMALL]: 0,
      [CarSize.MEDIUM]: 0,
      [CarSize.LARGE]: 0,
    };
    billings.forEach(b => counts[b.size]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [billings]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel Financeiro</h2>
          <p className="text-slate-500">Visão geral do seu lava rápido hoje.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Filter size={16} /> Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
            <Calendar size={16} /> Este Mês
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Faturado</p>
            <h3 className="text-2xl font-bold text-slate-900">R$ {stats.totalBilling.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Despesas</p>
            <h3 className="text-2xl font-bold text-slate-900">R$ {stats.totalExpenses.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Lucro Líquido</p>
            <h3 className="text-2xl font-bold text-slate-900">R$ {stats.profit.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold mb-6 text-slate-800">Fluxo Diário (7 Dias)</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="billing" name="Faturamento" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBilling)" />
                <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold mb-6 text-slate-800">Distribuição por Porte</h4>
          <div className="h-[300px] w-full flex items-center">
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
            <div className="flex flex-col gap-3 mr-4">
              {sizeData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-slate-600">{item.name}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-bold">Gerencie seu negócio com precisão</h3>
          <p className="text-blue-100 opacity-90">Acompanhe cada centavo que entra e sai do seu lava rápido.</p>
        </div>
        <p className="text-sm font-medium bg-blue-500 px-4 py-2 rounded-full">
          Sistema desenvolvido por <span className="font-bold">João Layón</span>
        </p>
      </div>
    </div>
  );
};
