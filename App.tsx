
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
import { Loader2, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('lavarapido_user_id'));
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isDbReady, setIsDbReady] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const refreshLocalData = () => {
    setBillings(getBillings());
    setExpenses(getExpenses());
  };

  // Inicialização (Só roda se estiver logado e com CloudID)
  React.useEffect(() => {
    if (isLogged) {
      const setup = async () => {
        const ready = await initDB();
        setIsDbReady(ready);
        if (ready) refreshLocalData();
      };
      setup();
    }
  }, [isLogged]);

  // Monitoramento
  React.useEffect(() => {
    if (!isDbReady || !isLogged) return;
    const syncInterval = setInterval(async () => {
      setIsSyncing(true);
      if (await checkForUpdates()) refreshLocalData();
      setIsSyncing(false);
    }, 15000);
    return () => clearInterval(syncInterval);
  }, [isDbReady, isLogged]);

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 gap-6">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <div className="text-center">
          <h2 className="text-white font-black text-xl tracking-tighter uppercase italic">Carregando Banco...</h2>
          <p className="text-slate-500 font-bold text-[10px] animate-pulse mt-1 uppercase tracking-widest">Sincronizando com a Nuvem</p>
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
      {isSyncing && (
        <div className="fixed top-6 right-6 z-50 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl">
            <RefreshCw size={12} className="text-blue-400 animate-spin" />
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Auto-Sync</span>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};
