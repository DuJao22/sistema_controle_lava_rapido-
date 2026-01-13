
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Wallet, FileText } from 'lucide-react';
import { Expense } from '../types';
import { getExpenses, saveExpense, deleteExpense } from '../lib/storage';

export const ExpenseForm: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    description: '',
    value: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const load = () => setExpenses(getExpenses());

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveExpense({ 
      ...formData, 
      id: editingId || '', 
    } as Expense);
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ description: '', value: 0, date: new Date().toISOString().split('T')[0] });
    load();
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({ 
      description: expense.description,
      value: expense.value,
      date: expense.date
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta despesa?')) {
      deleteExpense(id);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Despesas</h2>
          <p className="text-slate-500">Controle simplificado de gastos operacionais.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-md shadow-rose-500/20"
        >
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Observação</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider font-bold">Valor</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-slate-600">
                       <span className="truncate block max-w-xs">{e.description || 'Sem observação'}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600">R$ {e.value.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(e)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Plus size={18} className="rotate-45" />
                        </button>
                        <button 
                          onClick={() => handleDelete(e.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Simplificado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-rose-50/30">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="text-rose-500" size={20} />
                {editingId ? 'Editar Gasto' : 'Novas Despesas'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Data da Despesa</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Valor (R$)</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-bold">R$</span>
                   </div>
                   <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-rose-500 outline-none font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Observação</label>
                <div className="relative">
                  <FileText className="absolute top-3 left-4 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Ex: Pagamento Freelancer, Almoço..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 active:scale-95">
                  Confirmar Pagamentos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
