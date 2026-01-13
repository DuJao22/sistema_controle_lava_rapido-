
import React, { useState, useEffect } from 'react';
import { Car, User as UserIcon, LogIn, Loader2, AlertCircle, Lock, Eye, EyeOff, RefreshCw, Globe, CheckCircle2 } from 'lucide-react';
import { login, initDB, getSyncKey } from '../lib/storage';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [syncKey, setSyncKey] = useState(getSyncKey());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncKey.trim()) {
      setError('A Chave da Empresa é obrigatória.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('lavarapido_sync_key', syncKey.trim().toUpperCase());
      
      const ready = await initDB(true);
      if (!ready) {
        setError('Erro ao conectar à rede. Verifique sua conexão.');
        setLoading(false);
        return;
      }

      const user = login(username, password);
      
      if (user) {
        localStorage.setItem('lavarapido_user_id', user.id);
        localStorage.setItem('lavarapido_user_name', user.name);
        localStorage.setItem('lavarapido_user_role', user.role);
        onLoginSuccess(user);
      } else {
        setError('Usuário ou senha incorretos nesta rede.');
      }
    } catch (err) {
      setError('Erro ao processar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/20 mb-2">
            <Car size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Lava Rápido Pro</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <Globe size={14} className="text-blue-500" /> Acesso Global Inteligente
          </p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-[10px] font-black uppercase animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 mb-2 relative">
              <div className="absolute top-4 right-4 text-emerald-500 animate-pulse">
                <CheckCircle2 size={16} />
              </div>
              <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                Rede Detectada (Padrão)
              </label>
              <input
                required
                type="text"
                placeholder="EX: LAVA_RAPIDO_CENTRAL"
                value={syncKey}
                onChange={(e) => setSyncKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-transparent focus:border-emerald-500 outline-none font-black text-emerald-900 transition-all placeholder:text-emerald-200 uppercase"
              />
              <p className="text-[8px] text-emerald-500 mt-2 font-bold uppercase leading-tight italic">
                * Conectado automaticamente à sua rede master.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <UserIcon size={12} className="text-blue-600" /> Usuário
                </label>
                <input
                  required
                  type="text"
                  placeholder="Seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Lock size={12} className="text-blue-600" /> Senha
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
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-slate-800 shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              ENTRAR NO SISTEMA
            </button>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
          Rede Master • Global Sync Enabled
        </p>
      </div>
    </div>
  );
};
