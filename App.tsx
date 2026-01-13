
import * as React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillingForm } from './components/BillingForm';
import { ExpenseForm } from './components/ExpenseForm';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { initDB, getBillings, getExpenses, checkForUpdates } from './lib/storage';
import { Billing, Expense } from './types';
import { Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('lavarapido_user_id'));
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isDbReady, setIsDbReady] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [status, setStatus] = React.useState<'online' | 'offline' | 'updating'>('online');

  const reloadData = () => {
    setBillings(getBillings());
    setExpenses(getExpenses());
  };

  // Efeito de Inicialização (Download do Banco Mestre)
  React.useEffect(() => {
    if (isLogged) {
      const startup = async () => {
        setIsDbReady(false);
        const ok = await initDB(true); // Força download da nuvem ao abrir
        if (ok) {
          reloadData();
          setIsDbReady(true);
        }
      };
      startup();
    }
  }, [isLogged]);

  // Efeito de Polling (Sincronização entre aparelhos a cada 3 segundos)
  React.useEffect(() => {
    if (!isDbReady || !isLogged) return;

    const syncTask = async () => {
      setStatus('updating');
      try {
        const hasNewData = await checkForUpdates();
        if (hasNewData) {
          setIsSyncing(true);
          reloadData();
          setTimeout(() => setIsSyncing(false), 2000);
        }
        setStatus('online');
      } catch (e) {
        setStatus('offline');
      }
    };

    const timer = setInterval(syncTask, 4000);
    return () => clearInterval(timer);
  }, [isDbReady, isLogged]);

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-xl font-black uppercase italic tracking-widest animate-pulse">
          Sincronizando com a Rede...
        </h2>
        <p className="text-slate-500 text-[10px] mt-2 uppercase font-bold tracking-[0.3em]">Carregando banco de dados mestre</p>
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
      {/* Indicador de Status de Rede Flutuante */}
      <div className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 z-50">
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border-2 transition-all duration-500 ${
          status === 'online' ? 'bg-white border-emerald-100 text-emerald-600' : 
          status === 'updating' ? 'bg-white border-blue-100 text-blue-600' : 'bg-rose-600 border-rose-400 text-white'
        }`}>
          {status === 'updating' ? <RefreshCw size={16} className="animate-spin" /> : 
           status === 'online' ? <Wifi size={16} className="animate-pulse" /> : <WifiOff size={16} />}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase leading-none">
              {status === 'online' ? 'Conectado' : status === 'updating' ? 'Sincronizando' : 'Sem Sinal'}
            </span>
            <span className="text-[7px] font-bold uppercase opacity-60">Rede Global Master</span>
          </div>
          {isSyncing && (
             <div className="absolute -top-12 right-0 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase animate-bounce">
               Dados Atualizados!
             </div>
          )}
        </div>
      </div>

      {renderContent()}
    </Layout>
  );
};
