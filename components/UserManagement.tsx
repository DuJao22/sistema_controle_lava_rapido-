
import { UserPlus, Trash2, Shield, User as UserIcon, X, Check, Key, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getUsers, saveUser, deleteUser, changePassword, initDB } from '../lib/storage';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff' as 'admin' | 'staff'
  });

  const currentUserId = localStorage.getItem('lavarapido_user_id');

  const showNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setNotification(null), 6000);
  };

  const load = () => {
    try {
      const data = getUsers();
      setUsers(data);
    } catch (e) {
      showNotify("Erro ao carregar equipe", "error");
    }
  };

  useEffect(() => { load(); }, []);

  const handleRepair = async () => {
    setIsSyncing(true);
    await initDB(true);
    load();
    setIsSyncing(false);
    showNotify("Sistema sincronizado e reparado!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveUser({ ...formData, id: crypto.randomUUID() });
      showNotify(`Usuário ${formData.name} criado com sucesso!`);
      setIsModalOpen(false);
      setFormData({ username: '', password: '', name: '', role: 'staff' });
      load();
    } catch (err) {
      showNotify('Erro ao criar usuário.', 'error');
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    // TRAVA: Bloqueia reset do master
    if (userId === 'admin-master-id') {
      return showNotify('O Master deve mudar sua própria senha no menu lateral.', 'error');
    }

    if (confirm(`DESEJA RESETAR A SENHA DE ${userName.toUpperCase()} PARA "12345"?`)) {
      setResettingId(userId);
      try {
        await changePassword(userId, '12345');
        showNotify(`SUCESSO: A SENHA DE ${userName} AGORA É 12345`, 'success');
        setTimeout(() => load(), 800);
      } catch (err: any) {
        showNotify(err.message || 'ERRO AO RESETAR SENHA', 'error');
      } finally {
        setResettingId(null);
      }
    }
  };

  const handleDelete = async (id: string, username: string) => {
    const protectedUsers = ['dujao22', 'joao.adm', 'bianca.adm'];
    if (protectedUsers.includes(username.toLowerCase())) {
      return showNotify('Este administrador é protegido e não pode ser removido.', 'error');
    }
    
    if (confirm(`Remover usuário ${username}?`)) {
      try {
        await deleteUser(id);
        showNotify('Usuário removido.');
        load();
      } catch (e) {
        showNotify('Erro ao remover.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 relative pb-10">
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-lg px-8 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 animate-in fade-in slide-in-from-top-10 duration-500 border-2 ${notification.type === 'success' ? 'bg-slate-900 text-emerald-400 border-emerald-500' : 'bg-rose-900 text-white border-rose-500'}`}>
          <div className={`p-3 rounded-2xl ${notification.type === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-1">Aviso do Sistema</span>
            <span className="text-sm font-black uppercase tracking-widest leading-tight">{notification.msg}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Gestão de Equipe</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px]">Administre os níveis de acesso.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleRepair}
            className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> Reparar Acessos
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus size={18} /> Novo Usuário
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-3xl ${u.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                {u.role === 'admin' ? <Shield size={28} /> : <UserIcon size={28} />}
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">{u.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{u.username}</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Somente exibe o botão de reset se NÃO for o Master */}
              {u.id !== 'admin-master-id' ? (
                <button 
                  disabled={resettingId === u.id}
                  onClick={() => handleResetPassword(u.id, u.name)}
                  className="p-4 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all disabled:opacity-50 border border-transparent hover:border-blue-100"
                  title="Resetar Senha para 12345"
                >
                  {resettingId === u.id ? <Loader2 size={24} className="animate-spin text-blue-600" /> : <Key size={24} />}
                </button>
              ) : (
                <div className="p-4 text-emerald-500 bg-emerald-50 rounded-2xl opacity-60" title="Proteção Master Ativa">
                  <Shield size={24} />
                </div>
              )}
              
              {!['dujao22', 'joao.adm', 'bianca.adm'].includes(u.username.toLowerCase()) && (
                <button 
                  onClick={() => handleDelete(u.id, u.username)}
                  className="p-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Criar Acesso</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white shadow-sm rounded-full hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest ml-1">Nome Completo</label>
                  <input 
                    required 
                    placeholder="Nome do Colaborador"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest ml-1">Usuário para Login</label>
                  <input 
                    required 
                    placeholder="joao.lavador"
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().trim()})} 
                    className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-2 tracking-widest ml-1">Senha Inicial</label>
                  <input 
                    required 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase mb-3 tracking-widest ml-1">Permissão</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, role: 'staff'})} 
                      className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.role === 'staff' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      Comum
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, role: 'admin'})} 
                      className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.role === 'admin' ? 'bg-amber-500 text-white border-amber-500 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs tracking-[0.3em] hover:bg-blue-700 shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 transform active:scale-[0.98] transition-all">
                CADASTRAR EQUIPE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
