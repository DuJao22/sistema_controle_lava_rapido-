
import * as React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillingForm } from './components/BillingForm';
import { ExpenseForm } from './components/ExpenseForm';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { getBillings, getExpenses, isCloudActive, initDB } from './lib/storage';
import { Billing, Expense } from './types';
import { Loader2, Globe, Database, Server, WifiOff, AlertTriangle, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('lavarapido_user_id'));
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [connectionError, setConnectionError] = React.useState(false);
  const cloudActive = isCloudActive();

  const loadAllData = async () => {
    try {
      const [bData, eData] = await Promise.all([
        getBillings(),
        getExpenses()
      ]);
      setBillings(bData);
      setExpenses(eData);
      setConnectionError(false);
    } catch (err) {
      console.warn("Utilizando dados locais: Cloud temporariamente indisponível.");
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const startApp = async () => {
      if (isLogged) {
        // Tenta inicializar o banco, mas não trava se falhar
        await initDB();
        await loadAllData();
        const interval = setInterval(loadAllData, 15000);
        return () => clearInterval(interval);
      }
    };
    startApp();
  }, [isLogged]);

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  // Se estiver carregando há muito tempo ou der erro, permitimos ver a interface com dados locais
  if (loading && billings.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="relative mb-8">
           <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Server size={24} className="text-blue-300" />
           </div>
        </div>
        
        <h2 className="text-2xl font-black uppercase italic tracking-widest text-center">
          Sincronizando Sistema
        </h2>
        
        <div className="mt-8 max-w-sm w-full space-y-4">
           <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/10 flex items-start gap-4">
              <Globe className="text-blue-400 shrink-0" size={20} />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Status da Rede</p>
                 <p className="text-xs font-bold text-slate-300">Conectando ao cluster cbw4nq6vvk...</p>
              </div>
           </div>

           {loading && (
             <button 
               onClick={() => setLoading(false)}
               className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all border border-white/5"
             >
               Continuar em Modo Local (Offline)
             </button>
           )}
        </div>

        <p className="fixed bottom-10 text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] opacity-40">
          Infraestrutura SQLite Cloud Ativa
        </p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard billings={billings} expenses={expenses} />;
      case 'billing': return <BillingForm />;
      case 'expenses': return <ExpenseForm />;
      case 'reports': return <Reports billings={billings} expenses={expenses} />;
      case 'users': return <UserManagement />;
      default: return <Dashboard billings={billings} expenses={expenses} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="fixed bottom-6 right-6 z-50 cloud-status print-hidden">
        <div className={`bg-white border-2 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 transition-all ${!connectionError ? 'border-emerald-100 shadow-emerald-500/10' : 'border-amber-100 shadow-amber-500/10'}`}>
          {!connectionError ? (
            <div className="relative">
              <ShieldCheck size={18} className="text-emerald-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
          ) : (
            <WifiOff size={18} className="text-amber-500" />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase leading-none text-slate-900">
              {!connectionError ? 'NUVEM ATIVA' : 'MODO OFFLINE'}
            </span>
            <span className="text-[7px] font-bold uppercase opacity-60 text-slate-500">
              {!connectionError ? 'Sincronização Real-time' : 'Dados Salvos Localmente'}
            </span>
          </div>
        </div>
      </div>

      {connectionError && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
             <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                <AlertTriangle size={24} />
             </div>
             <div>
                <h4 className="text-sm font-black text-amber-900 uppercase">Atenção: Erro de Comunicação (CORS)</h4>
                <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed">O sistema não conseguiu autorização para falar com a Nuvem. Autorize este domínio no painel do SQLite Cloud para sincronizar entre aparelhos.</p>
             </div>
          </div>
          <button onClick={loadAllData} className="px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20">Tentar Reconectar</button>
        </div>
      )}

      {renderContent()}
    </Layout>
  );
};
