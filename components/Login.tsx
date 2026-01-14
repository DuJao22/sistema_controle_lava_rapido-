
import React, { useState } from 'react';
import { Car, User as UserIcon, LogIn, Loader2, AlertCircle, Lock, Eye, EyeOff, Globe, WifiOff } from 'lucide-react';
import { login, initDB } from '../lib/storage';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      const ready = await initDB();
      if (!ready) {
        setError('Falha na conexão com SQLite Cloud. Verifique API_KEY e String de Conexão.');
        setLoading(false);
        return;
      }

      const user = await login(username, password);
      
      if (user) {
        localStorage.setItem('lavarapido_user_id', user.id);
        localStorage.setItem('lavarapido_user_name', user.name);
        localStorage.setItem('lavarapido_user_role', user.role);
        onLoginSuccess(user);
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro de rede ao conectar ao SQLite Cloud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 text-slate-900">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex bg-blue-600 p-5 rounded-[2rem] shadow-2xl shadow-blue-500/20 mb-2">
            <Car size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Lava Rápido Pro</h1>
          <p className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <Globe size={14} /> SQLite Cloud Sync Ativo
          </p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-[10px] font-black uppercase animate-shake">
              <AlertCircle size={18} />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xs tracking-[0.3em] hover:bg-blue-600 shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              AUTENTICAR NO CLOUD
            </button>
          </form>
        </div>
        
        <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
          Infraestrutura SQLite Cloud • v5.0
        </p>
      </div>
    </div>
  );
};
