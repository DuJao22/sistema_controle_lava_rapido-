
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

  // Inicialização
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

  // Monitoramento em tempo real (5 segundos)
  React.useEffect(() => {
    if (!isDbReady || !isLogged) return;
    const syncInterval = setInterval(async () => {
      // Pequeno atraso visual para não incomodar, mas buscando dados
      if (await checkForUpdates()) {
        setIsSyncing(true);
        refreshLocalData();
        setTimeout(() => setIsSyncing(false), 2000);
      }
    }, 5000); // 5 segundos para maior reatividade
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
        <div className="fixed top-6 right-6 z-[200] pointer-events-none">
          <div className="bg-emerald-500 px-4 py-2 rounded-full border border-emerald-400 flex items-center gap-2 shadow-2xl animate-bounce">
            <RefreshCw size={12} className="text-white animate-spin" />
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Dados Atualizados!</span>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};
