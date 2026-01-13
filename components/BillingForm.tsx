
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Clock, RefreshCw, ShieldCheck, ChevronRight, User as UserIcon } from 'lucide-react';
import { Billing, CarSize, PaymentMethod } from '../types';
import { getBillings, saveBilling, deleteBilling, loadFromCloud } from '../lib/storage';

export const BillingForm: React.FC = () => {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<Omit<Billing, 'id' | 'createdBy'>>({
    washType: '',
    size: CarSize.SMALL,
    paymentMethod: PaymentMethod.PIX,
    value: 0,
    date: new Date().toISOString().split('T')[0],
    time: getCurrentTime()
  });

  const load = () => setBillings(getBillings());

  const handleManualSync = async () => {
    setIsSyncing(true);
    const cloudData = await loadFromCloud();
    if (cloudData) { window.location.reload(); }
    setIsSyncing(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); 
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    await saveBilling({ ...formData, id: editingId || '', createdBy: localStorage.getItem('lavarapido_user_name') || 'unknown' } as Billing);
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      washType: '', size: CarSize.SMALL, paymentMethod: PaymentMethod.PIX, value: 0, 
      date: new Date().toISOString().split('T')[0], time: getCurrentTime()
    });
    load();
    setIsSyncing(false);
  };

  const handleEdit = (billing: Billing) => {
    setEditingId(billing.id);
    setFormData({ ...billing });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este faturamento?')) {
      setIsSyncing(true);
      await deleteBilling(id);
      load();
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Lançar Vendas</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Controle seus atendimentos diários.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={handleManualSync} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> Sincronizar
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">
            <Plus size={18} /> Novo Serviço
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Serviço / Lançado por</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Veículo</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Horário</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billings.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-xs font-black uppercase italic opacity-50">Nenhum serviço registrado.</td></tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.id} className="group hover:bg-blue-50/40 transition-all">
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900 uppercase tracking-tight">{b.washType}</div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        <UserIcon size={10} className="text-blue-500" /> {b.createdBy || 'Sistema'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200">{b.size}</span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600">{new Date(b.date).toLocaleDateString('pt-BR')} às {b.time}</td>
                    <td className="px-6 py-5 font-black text-emerald-700 italic">R$ {b.value.toFixed(2)}</td>
                    <td className="px-6 py-5 text-right flex justify-end gap-1">
                      <button onClick={() => handleEdit(b)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Plus size={18} className="rotate-45" /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
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
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-800 uppercase italic">Lançar Novo Serviço</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white shadow-sm rounded-full hover:text-slate-600 transition-colors"><X size={20} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-700 uppercase mb-2 block tracking-widest">O que foi feito?</label>
                      <input 
                        required 
                        value={formData.washType} 
                        onChange={e => setFormData({...formData, washType: e.target.value})} 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                        placeholder="Ex: Lavagem Completa + Cera" 
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase mb-2 block tracking-widest">Valor do Serviço</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-700">R$</span>
                        <input 
                          required 
                          type="number" 
                          step="0.01" 
                          value={formData.value} 
                          onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} 
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none font-black text-emerald-700 transition-all" 
                        />
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase mb-2 block tracking-widest">Data do Atendimento</label>
                      <input 
                        type="date" 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all" 
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase mb-2 block tracking-widest">Porte do Veículo</label>
                      <select 
                        value={formData.size} 
                        onChange={e => setFormData({...formData, size: e.target.value as CarSize})}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all appearance-none"
                      >
                        {Object.values(CarSize).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase mb-2 block tracking-widest">Método de Pagamento</label>
                      <select 
                        value={formData.paymentMethod} 
                        onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all appearance-none"
                      >
                        {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                   </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-blue-600 shadow-xl transform active:scale-[0.98] transition-all">SALVAR REGISTRO</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
