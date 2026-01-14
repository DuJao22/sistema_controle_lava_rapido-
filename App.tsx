
import * as React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillingForm } from './components/BillingForm';
import { ExpenseForm } from './components/ExpenseForm';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { getBillings, getExpenses, isCloudActive } from './lib/storage';
import { Billing, Expense } from './types';
import { Loader2, Globe, Database, Server } from 'lucide-react';

export const App: React.FC = () => {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('lavarapido_user_id'));
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const cloudActive = isCloudActive();

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [bData, eData] = await Promise.all([
        getBillings(),
        getExpenses()
      ]);
      setBillings(bData);
      setExpenses(eData);
    } catch (err) {
      console.warn("Utilizando dados locais: Cloud temporariamente indisponível.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isLogged) {
      loadAllData();
      const interval = setInterval(loadAllData, cloudActive ? 15000 : 60000);
      return () => clearInterval(interval);
    }
  }, [isLogged, cloudActive]);

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  if (loading && billings.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-xl font-black uppercase italic tracking-widest">
          {cloudActive ? 'Conectando ao SQLite Cloud...' : 'Sincronizando Local...'}
        </h2>
        <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.3em]">
          {cloudActive ? 'database.db @ cbw4nq6vvk' : 'Persistência no Navegador'}
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
        <div className={`bg-white border-2 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 transition-all ${cloudActive ? 'border-emerald-100 shadow-emerald-500/10' : 'border-amber-100'}`}>
          {cloudActive ? (
            <div className="relative">
              <Server size={18} className="text-emerald-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
          ) : (
            <Database size={16} className="text-amber-500" />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase leading-none text-slate-900">
              {cloudActive ? 'DATABASE.DB' : 'LOCAL STORAGE'}
            </span>
            <span className="text-[7px] font-bold uppercase opacity-60 text-slate-500">
              {cloudActive ? 'SQLite Cloud: Conectado' : 'Salvo neste Aparelho'}
            </span>
          </div>
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};
