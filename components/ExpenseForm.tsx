
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Wallet } from 'lucide-react';
import { Expense } from '../types';
import { getExpenses, saveExpense, deleteExpense } from '../lib/storage';

export const ExpenseForm: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Expense, 'id' | 'total'>>({
    freelancer: 0,
    snacks: 0,
    others: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const load = () => setExpenses(getExpenses());

  useEffect(() => {
    load();
  }, []);

  const totalCalculated = formData.freelancer + formData.snacks + formData.others;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveExpense({ 
      ...formData, 
      id: editingId || '', 
      total: totalCalculated 
    } as Expense);
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ freelancer: 0, snacks: 0, others: 0, date: new Date().toISOString().split('T')[0] });
    load();
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({ 
      freelancer: expense.freelancer,
      snacks: expense.snacks,
      others: expense.others,
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
          <p className="text-slate-500">Controle os gastos operacionais do dia.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-md shadow-rose-500/20"
        >
          <Plus size={20} /> Registrar Gastos
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Freelancers</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Lanches</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Outros</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider font-bold">Total</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-slate-600">R$ {e.freelancer.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">R$ {e.snacks.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">R$ {e.others.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">R$ {e.total.toFixed(2)}</td>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-rose-50/30">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="text-rose-500" size={20} />
                {editingId ? 'Editar Gastos' : 'Novas Despesas'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data da Despesa</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Freelancer (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.freelancer}
                      onChange={(e) => setFormData({ ...formData, freelancer: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lanches (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.snacks}
                      onChange={(e) => setFormData({ ...formData, snacks: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Outras Despesas (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.others}
                    onChange={(e) => setFormData({ ...formData, others: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Calculado:</span>
                  <span className="text-2xl font-black text-slate-900">R$ {totalCalculated.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20">
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
