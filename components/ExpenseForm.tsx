
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Wallet, FileText, User as UserIcon } from 'lucide-react';
import { Expense } from '../types';
import { getExpenses, saveExpense, deleteExpense } from '../lib/storage';

export const ExpenseForm: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Expense, 'id' | 'createdBy'>>({
    description: '',
    value: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // FIX: Make load function async to handle the promise returned by getExpenses
  const load = async () => setExpenses(await getExpenses());

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userName = localStorage.getItem('lavarapido_user_name') || 'Sistema';
    
    await saveExpense({ 
      ...formData, 
      id: editingId || '',
      createdBy: userName
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

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta despesa?')) {
      await deleteExpense(id);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Despesas Operacionais</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Controle simplificado de saídas de caixa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20"
        >
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data / Lançado por</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest font-bold">Valor</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-xs font-black uppercase italic opacity-50">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-rose-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900">{new Date(e.date).toLocaleDateString('pt-BR')}</div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        <UserIcon size={10} className="text-rose-400" /> {e.createdBy || 'Sistema'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-medium italic">
                       {e.description || 'Sem descrição'}
                    </td>
                    <td className="px-6 py-5 font-black text-rose-600">R$ {e.value.toFixed(2)}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(e)}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Plus size={18} className="rotate-45" />
                        </button>
                        <button 
                          onClick={() => handleDelete(e.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-md overflow-hidden animate-in zoom-in duration-300">
            <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-2">
                <Wallet className="text-rose-500" size={24} />
                {editingId ? 'Editar Gasto' : 'Novo Lançamento'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 bg-white shadow-sm rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest ml-1">Data do Gasto</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-rose-500 outline-none font-bold text-slate-900 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest ml-1">Valor (R$)</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <span className="text-rose-600 font-black">R$</span>
                   </div>
                   <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-rose-500 outline-none font-black text-rose-600 text-lg transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest ml-1">Observação / Destino</label>
                <div className="relative">
                  <FileText className="absolute top-1/2 -translate-y-1/2 left-6 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-rose-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                    placeholder="Ex: Produto de limpeza, Aluguel..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-rose-600 shadow-xl transition-all active:scale-[0.98]">
                  CONFIRMAR PAGAMENTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
