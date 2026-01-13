
import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer, TrendingUp, TrendingDown, CheckCircle2, Table as TableIcon, Filter, RotateCcw } from 'lucide-react';
import { Billing, Expense } from '../types';

interface ReportsProps {
  billings: Billing[];
  expenses: Expense[];
}

export const Reports: React.FC<ReportsProps> = ({ billings, expenses }) => {
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

  const summary = useMemo(() => {
    const totalB = filteredData.billings.reduce((s, b) => s + (Number(b.value) || 0), 0);
    const totalE = filteredData.expenses.reduce((s, e) => s + (Number(e.value) || 0), 0);
    return {
      totalB,
      totalE,
      profit: totalB - totalE,
      totalServices: filteredData.billings.length
    };
  }, [filteredData]);

  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; 
    
    csvContent += "LAVA RAPIDO PRO - RELATÓRIO FINANCEIRO CONSOLIDADO\n";
    csvContent += `Periodo:;${startDate || 'Inicio'} ate ${endDate || 'Hoje'}\n`;
    csvContent += `Gerado em:;${new Date().toLocaleString('pt-BR')}\n\n`;

    csvContent += "--- 1. ENTRADAS (FATURAMENTO) ---\n";
    csvContent += "Data;Lavagem;Pagamento;Porte;Valor Bruto (R$)\n";
    
    filteredData.billings.forEach(b => {
      const formattedDate = new Date(b.date).toLocaleDateString('pt-BR');
      const formattedValue = b.value.toFixed(2).replace('.', ',');
      csvContent += `${formattedDate};${b.washType};${b.paymentMethod};${b.size};${formattedValue}\n`;
    });

    csvContent += `TOTAL ENTRADAS:;;;;R$ ${summary.totalB.toFixed(2).replace('.', ',')}\n\n`;

    csvContent += "--- 2. SAÍDAS (DESPESAS) ---\n";
    csvContent += "Data;Observacao;Valor (R$)\n";
    
    filteredData.expenses.forEach(e => {
      const formattedDate = new Date(e.date).toLocaleDateString('pt-BR');
      const formattedValue = e.value.toFixed(2).replace('.', ',');
      csvContent += `${formattedDate};${e.description || 'N/A'};${formattedValue}\n`;
    });

    csvContent += `TOTAL SAÍDAS:;;R$ ${summary.totalE.toFixed(2).replace('.', ',')}\n\n`;

    csvContent += "--- 3. BALANÇO E PERFORMANCE ---\n";
    csvContent += `LUCRO LÍQUIDO:;R$ ${summary.profit.toFixed(2).replace('.', ',')}\n`;
    csvContent += `TOTAL DE SERVIÇOS:;${summary.totalServices}\n\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_LavaRapido_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedHistory = useMemo(() => {
    const combined = [
      ...filteredData.billings.map(b => ({ ...b, isExpense: false, sortDate: new Date(b.date).getTime() })),
      ...filteredData.expenses.map(e => ({ ...e, isExpense: true, sortDate: new Date(e.date).getTime() }))
    ];
    return combined.sort((a, b) => b.sortDate - a.sortDate);
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 print-hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios Gerais</h2>
          <p className="text-slate-500">Filtragem e exportação de dados.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Período</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm border-none focus:ring-0 text-slate-700 font-medium" />
            <span className="text-slate-300">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm border-none focus:ring-0 text-slate-700 font-medium" />
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"><RotateCcw size={16} /></button>
          </div>
          <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"><TableIcon size={16} /> Excel</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"><Printer size={16} /> Imprimir</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Serviços</p>
          <p className="text-2xl font-black text-slate-900">{summary.totalServices}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Saídas</p>
          <p className="text-2xl font-black text-rose-500">R$ {summary.totalE.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Lucro Líquido</p>
          <p className={`text-2xl font-black ${summary.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {summary.profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={20} className="text-blue-500" /> Extrato</h3>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
          {sortedHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">Sem registros no período.</div>
          ) : (
            sortedHistory.map((item: any, idx) => (
              <div key={item.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.isExpense ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-none mb-1">
                      {item.isExpense ? (item.description || 'Despesa') : `Serviço: ${item.washType}`}
                    </p>
                    <span className="text-xs font-medium text-slate-400">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-lg ${item.isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.isExpense ? '-' : '+'} R$ {(item.value).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-900 text-white relative overflow-hidden print:bg-white print:text-black">
          <div className="max-w-md ml-auto space-y-4">
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center print:border-slate-200">
              <div>
                <p className="text-xs uppercase font-black text-slate-500 tracking-tighter mb-1">Saldo do Período</p>
                <span className="text-4xl font-black text-white print:text-black">R$ {summary.profit.toFixed(2)}</span>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest ${summary.profit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {summary.profit >= 0 ? 'LUCRO' : 'PREJUÍZO'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
