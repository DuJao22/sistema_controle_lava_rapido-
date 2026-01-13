
import React, { useState } from 'react';
import { Car, User as UserIcon, LogIn, Loader2, AlertCircle, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { login, initDB, loadFromCloud } from '../lib/storage';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await initDB();
      const user = login(username, password);
      
      if (user) {
        localStorage.setItem('lavarapido_user_id', user.id);
        localStorage.setItem('lavarapido_user_name', user.name);
        localStorage.setItem('lavarapido_user_role', user.role);
        onLoginSuccess(user);
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao processar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await initDB(); // Isso força o recarregamento da nuvem
      alert('Dados sincronizados com sucesso! Tente o login novamente.');
    } catch (e) {
      alert('Erro ao sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20 mb-2">
            <Car size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Lava Rápido Pro</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Painel Administrativo</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                <UserIcon size={12} className="text-blue-600" /> Seu Usuário
              </label>
              <input
                required
                type="text"
                autoFocus
                placeholder="Ex: joao.adm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Lock size={12} className="text-blue-600" /> Sua Senha
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-slate-800 shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />}
              ACESSAR SISTEMA
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <button 
              type="button"
              onClick={handleManualSync}
              className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors tracking-widest"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              Sincronizar novos usuários
            </button>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
          Versão 2.6.0 • Gestão Privada
        </p>
      </div>
    </div>
  );
};
