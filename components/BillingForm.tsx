
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Clock, CreditCard, RefreshCw } from 'lucide-react';
import { Billing, CarSize, PaymentMethod } from '../types';
import { getBillings, saveBilling, deleteBilling } from '../lib/storage';

export const BillingForm: React.FC = () => {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<Omit<Billing, 'id'>>({
    washType: '',
    size: CarSize.SMALL,
    paymentMethod: PaymentMethod.PIX,
    value: 0,
    date: new Date().toISOString().split('T')[0],
    time: getCurrentTime()
  });

  const load = () => setBillings(getBillings());

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // Auto-refresh a cada 10s para ver dados de outros usuários
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBilling({ ...formData, id: editingId || '' } as Billing);
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      washType: '', 
      size: CarSize.SMALL, 
      paymentMethod: PaymentMethod.PIX, 
      value: 0, 
      date: new Date().toISOString().split('T')[0],
      time: getCurrentTime()
    });
    load();
  };

  const handleEdit = (billing: Billing) => {
    setEditingId(billing.id);
    setFormData({ ...billing });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este faturamento?')) {
      await deleteBilling(id);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Faturamento</h2>
          <p className="text-slate-500">Serviços registrados com horário e sincronização global.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={load}
            className="p-2.5 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 rounded-xl transition-all"
            title="Sincronizar Manualmente"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => {
              setFormData({...formData, time: getCurrentTime()});
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            <Plus size={20} /> Novo Serviço
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Serviço</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Porte</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Data / Hora</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum serviço registrado ainda.
                  </td>
                </tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{b.washType}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.id.substring(0,8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        b.size === CarSize.SMALL ? 'bg-blue-100 text-blue-700' :
                        b.size === CarSize.MEDIUM ? 'bg-indigo-100 text-indigo-700' :
                        'bg-violet-100 text-violet-700'
                      }`}>
                        {b.size}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{new Date(b.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-xs text-blue-500 font-bold flex items-center gap-1">
                            <Clock size={12} /> {b.time}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-slate-600">
                         <CreditCard size={14} className="text-slate-400" />
                         <span className="text-sm">{b.paymentMethod}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600">R$ {b.value.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(b)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Plus size={18} className="rotate-45" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Lavagem</label>
                  <input
                    required
                    type="text"
                    value={formData.washType}
                    onChange={(e) => setFormData({ ...formData, washType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Geral com Cera"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock size={14} /> Horário
                  </label>
                  <input
                    required
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Porte do Veículo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(CarSize).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, size: s })}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          formData.size === s 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'border-slate-200 text-slate-500 hover:border-blue-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                  Salvar Registro Global
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
