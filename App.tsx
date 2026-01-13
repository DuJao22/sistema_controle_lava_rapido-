
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
import { Loader2, RefreshCw, CloudOff, Globe, Wifi, CheckCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('lavarapido_user_id'));
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isDbReady, setIsDbReady] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncStatus, setLastSyncStatus] = React.useState<'online' | 'syncing' | 'error'>('online');

  const refreshLocalData = () => {
    setBillings(getBillings());
    setExpenses(getExpenses());
  };

  const performSyncCheck = async () => {
    if (!isDbReady || !isLogged) return;
    
    try {
      setLastSyncStatus('syncing');
      const hasUpdates = await checkForUpdates();
      
      if (hasUpdates) {
        setIsSyncing(true);
        refreshLocalData();
        setTimeout(() => setIsSyncing(false), 2000);
      }
      setLastSyncStatus('online');
    } catch (e) {
      setLastSyncStatus('error');
    }
  };

  React.useEffect(() => {
    if (isLogged) {
      const setup = async () => {
        const ready = await initDB(true);
        setIsDbReady(ready);
        if (ready) refreshLocalData();
      };
      setup();
    }
  }, [isLogged]);

  // Polling agressivo a cada 3 segundos para sincronia quase real entre dispositivos
  React.useEffect(() => {
    if (!isDbReady || !isLogged) return;

    const interval = setInterval(performSyncCheck, 3000);

    const handleFocus = () => performSyncCheck();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', performSyncCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', performSyncCheck);
    };
  }, [isDbReady, isLogged]);

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 gap-8 text-white">
        <div className="relative">
          <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
          <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-8 h-8 opacity-50" />
        </div>
        <div className="text-center px-6">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Sincronização Atômica</h2>
          <p className="text-blue-400 font-bold text-[10px] mt-3 uppercase tracking-[0.3em] animate-pulse italic">Conectando ao banco de dados mestre...</p>
        </div>
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
      <div className="fixed top-4 right-4 z-[200] flex flex-col items-end gap-2 pointer-events-none">
        {isSyncing && (
          <div className="bg-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl animate-in slide-in-from-right duration-500 border border-emerald-400">
             <CheckCircle size={14} className="text-white" />
             <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Nuvem Sincronizada!</span>
          </div>
        )}
        
        <div className={`px-4 py-2 rounded-2xl shadow-xl border-2 flex items-center gap-3 transition-all duration-500 ${
          lastSyncStatus === 'online' ? 'bg-white text-emerald-600 border-emerald-100' : 
          lastSyncStatus === 'syncing' ? 'bg-white text-blue-600 border-blue-100' : 'bg-rose-600 text-white border-rose-400'
        }`}>
          <div className="flex items-center gap-2">
             {lastSyncStatus === 'online' ? <Wifi size={14} className="animate-pulse" /> : 
              lastSyncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <CloudOff size={14} />}
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-tighter leading-none">
                  {lastSyncStatus === 'online' ? 'Ponto Mestre OK' : 
                   lastSyncStatus === 'syncing' ? 'Baixando' : 'Erro Nuvem'}
                </span>
                <span className="text-[6px] font-bold uppercase opacity-60">Rede Única Global</span>
             </div>
          </div>
        </div>
      </div>

      {renderContent()}
    </Layout>
  );
};
