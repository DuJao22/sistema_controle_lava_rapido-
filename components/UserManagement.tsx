
import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User as UserIcon, X, Check, Key } from 'lucide-react';
import { User } from '../types';
import { getUsers, saveUser, deleteUser, changePassword } from '../lib/storage';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff' as 'admin' | 'staff'
  });

  const load = () => setUsers(getUsers());

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUser({ ...formData, id: crypto.randomUUID() });
    setIsModalOpen(false);
    setFormData({ username: '', password: '', name: '', role: 'staff' });
    load();
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (confirm(`Deseja resetar a senha de ${userName} para "12345"?`)) {
      await changePassword(userId, '12345');
      alert('Senha resetada com sucesso para: 12345');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    const protectedUsers = ['dujao22', 'joao.adm', 'bianca.adm'];
    if (protectedUsers.includes(username.toLowerCase())) {
      return alert('Este usuário administrador é protegido e não pode ser removido.');
    }
    
    if (confirm(`Remover usuário ${username}?`)) {
      await deleteUser(id);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Gerenciar Equipe</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Controle de acesso dos funcionários.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <UserPlus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${u.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                {u.role === 'admin' ? <Shield size={24} /> : <UserIcon size={24} />}
              </div>
              <div>
                <p className="font-black text-slate-900 leading-tight uppercase tracking-tight">{u.name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">@{u.username}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => handleResetPassword(u.id, u.name)}
                className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Resetar Senha"
              >
                <Key size={18} />
              </button>
              
              {!['dujao22', 'joao.adm', 'bianca.adm'].includes(u.username.toLowerCase()) && (
                <button 
                  onClick={() => handleDelete(u.id, u.username)}
                  className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Novo Acesso</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 bg-white shadow-sm rounded-full hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Nome Completo</label>
                  <input 
                    required 
                    placeholder="Ex: João Silva"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Username (Login)</label>
                  <input 
                    required 
                    placeholder="Ex: joao.adm"
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().trim()})} 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Senha Provisória</label>
                  <input 
                    required 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest">Nível de Acesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, role: 'staff'})} 
                      className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.role === 'staff' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      Funcionário
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, role: 'admin'})} 
                      className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.role === 'admin' ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      Gerente/Admin
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-blue-700 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all">
                <Check size={18} /> CRIAR CONTA
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
