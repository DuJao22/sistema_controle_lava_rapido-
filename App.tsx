
import * as React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillingForm } from './components/BillingForm';
import { ExpenseForm } from './components/ExpenseForm';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { getBillings, getExpenses } from './lib/storage';
import { Billing, Expense } from './types';
import { Loader2, Globe, Database, Server } from 'lucide-react';

export const App: React.FC = () => {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('lavarapido_user_id'));
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);

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
      console.error("Erro ao carregar dados do SQLite Cloud", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isLogged) {
      loadAllData();
      // Polling básico para simular tempo real (O SQLite Cloud também suporta WebSockets em um app real)
      const interval = setInterval(loadAllData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLogged]);

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  if (loading && billings.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-xl font-black uppercase italic tracking-widest">Acessando SQLite Cloud...</h2>
        <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.3em]">Sincronização Ativa</p>
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
      <div className="fixed bottom-6 right-6 z-50 cloud-status">
        <div className="bg-white border-2 border-slate-100 text-slate-800 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <Database size={16} className="text-blue-600 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase leading-none">SQLite Cloud</span>
            <span className="text-[7px] font-bold uppercase opacity-60">Database Sincronizado</span>
          </div>
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};
