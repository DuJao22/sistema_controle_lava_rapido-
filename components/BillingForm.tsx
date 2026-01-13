
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Clock, CreditCard, RefreshCw, ShieldCheck, ChevronRight } from 'lucide-react';
import { Billing, CarSize, PaymentMethod } from '../types';
import { getBillings, saveBilling, deleteBilling, loadFromCloud, initDB } from '../lib/storage';

export const BillingForm: React.FC = () => {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
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

  const handleManualSync = async () => {
    setIsSyncing(true);
    const cloudData = await loadFromCloud();
    if (cloudData) {
       window.location.reload(); 
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
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
      {/* Header Responsivo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Lançar Vendas</h2>
          <p className="text-sm text-slate-500 font-medium">Controle seus atendimentos diários.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleManualSync}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            Sincronizar
          </button>
          <button 
            onClick={() => {
              setFormData({...formData, time: getCurrentTime()});
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} /> Novo Serviço
          </button>
        </div>
      </div>

      {/* Tabela com Scroll Mobile */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Serviço / ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Veículo</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Horário</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest italic opacity-50">
                    Nenhum serviço registrado hoje.
                  </td>
                </tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900 leading-tight mb-1 uppercase tracking-tight">{b.washType}</div>
                      <div className="text-[9px] text-slate-300 font-mono tracking-widest">{b.id.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        b.size === CarSize.SMALL ? 'bg-blue-100 text-blue-600' :
                        b.size === CarSize.MEDIUM ? 'bg-indigo-100 text-indigo-600' :
                        'bg-violet-100 text-violet-600'
                      }`}>
                        {b.size}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700">{new Date(b.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                            <Clock size={10} /> {b.time}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5 font-black text-emerald-600">R$ {b.value.toFixed(2)}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(b)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <Plus size={18} className="rotate-45" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
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
        {/* Indicador de Swipe no Mobile */}
        <div className="md:hidden p-3 bg-slate-50 text-[9px] text-center font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
           <ChevronRight size={12} /> deslize para ver mais detalhes
        </div>
      </div>

      {/* Modal Adaptável */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-100">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase italic">
                  {editingId ? 'Editar Venda' : 'Nova Venda'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sincronização Cloud Ativa</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Serviço Prestado</label>
                  <input
                    required
                    type="text"
                    autoFocus
                    value={formData.washType}
                    onChange={(e) => setFormData({ ...formData, washType: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-bold placeholder:text-slate-300 text-sm sm:text-base"
                    placeholder="Ex: Lavagem + Cera"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hora</label>
                  <input
                    required
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 sm:py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-4 py-3 sm:py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 text-sm"
                  >
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preço (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs sm:text-sm">R$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 sm:py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-600 text-base sm:text-lg"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Porte</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(CarSize).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, size: s })}
                        className={`py-3 text-[9px] sm:text-[10px] font-black rounded-2xl border-2 transition-all ${
                          formData.size === s 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200'
                        }`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 pb-2">
                <button type="submit" disabled={isSyncing} className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                  {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  SALVAR NA NUVEM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
