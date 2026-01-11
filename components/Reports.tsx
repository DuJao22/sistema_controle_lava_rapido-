
import React, { useMemo } from 'react';
// Fix: Added missing TrendingUp and TrendingDown imports from lucide-react
import { Download, FileText, Printer, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Billing, Expense } from '../types';

interface ReportsProps {
  billings: Billing[];
  expenses: Expense[];
}

export const Reports: React.FC<ReportsProps> = ({ billings, expenses }) => {
  const summary = useMemo(() => {
    const totalB = billings.reduce((s, b) => s + b.value, 0);
    const totalE = expenses.reduce((s, e) => s + e.total, 0);
    return {
      totalB,
      totalE,
      profit: totalB - totalE,
      ticketMedio: billings.length ? totalB / billings.length : 0,
      totalServices: billings.length
    };
  }, [billings, expenses]);

  const handleExport = () => {
    alert('Funcionalidade de exportação PDF/Excel estará disponível em breve!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios Gerais</h2>
          <p className="text-slate-500">Documentação completa das atividades financeiras.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 transition-all"
          >
            <Download size={18} /> Exportar CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-md"
          >
            <Printer size={18} /> Imprimir Relatório
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Serviços</p>
          <p className="text-2xl font-bold text-slate-900">{summary.totalServices}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-slate-900">R$ {summary.ticketMedio.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Custo Médio</p>
          <p className="text-2xl font-bold text-rose-500">R$ {(summary.totalE / (summary.totalServices || 1)).toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Margem Bruta</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.totalB ? ((summary.profit / summary.totalB) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText size={20} className="text-blue-500" />
            Extrato Consolidado
          </h3>
          <span className="text-sm text-slate-400 italic">Ordenado por data decrescente</span>
        </div>
        
        <div className="divide-y divide-slate-50">
          {[...billings, ...expenses.map(e => ({ ...e, isExpense: true }))]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((item: any, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.isExpense ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                    {item.isExpense ? <TrendingUp size={18} className="rotate-180" /> : <TrendingDown size={18} className="rotate-180" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {item.isExpense ? 'Despesa Operacional' : `Lavação: ${item.car}`}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${item.isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.isExpense ? '-' : '+'} R$ {(item.total || item.value).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{item.isExpense ? 'Saída' : 'Entrada'}</p>
                </div>
              </div>
            ))}
        </div>

        <div className="p-8 bg-slate-900 text-white">
          <div className="max-w-md ml-auto space-y-3">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Entradas:</span>
              <span className="text-white">R$ {summary.totalB.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Saídas:</span>
              <span className="text-white">R$ {summary.totalE.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-lg font-bold">Saldo do Período:</span>
              <span className="text-2xl font-black text-emerald-400">R$ {summary.profit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <p className="text-sm text-slate-400">Sistema desenvolvido por <span className="text-slate-600 font-bold underline decoration-blue-500 decoration-2">João Layón</span></p>
      </div>
    </div>
  );
};
