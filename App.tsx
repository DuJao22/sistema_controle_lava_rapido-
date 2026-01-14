
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
import { Loader2, Globe, Server, WifiOff, AlertTriangle, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('lavarapido_user_id'));
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [connectionError, setConnectionError] = React.useState(false);

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
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const startApp = async () => {
      if (isLogged) {
        const connected = await initDB();
        setConnectionError(!connected);
        await loadAllData();
        const interval = setInterval(loadAllData, 10000);
        return () => clearInterval(interval);
      }
    };
    startApp();
  }, [isLogged]);

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  if (loading && billings.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-xl font-black uppercase italic tracking-widest text-center">Conectando ao Banco Master</h2>
        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">auth.sqlitecloud</p>
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
      <div className="fixed bottom-6 right-6 z-50 print-hidden">
        <div className={`bg-white border-2 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 ${!connectionError ? 'border-emerald-100' : 'border-amber-100'}`}>
          {!connectionError ? (
            <ShieldCheck size={18} className="text-emerald-500" />
          ) : (
            <WifiOff size={18} className="text-amber-500" />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-900 leading-none">
              {!connectionError ? 'SISTEMA ONLINE' : 'MODO LOCAL'}
            </span>
            <span className="text-[7px] font-bold uppercase text-slate-400">
              {!connectionError ? 'auth.sqlitecloud sincronizado' : 'aguardando rede...'}
            </span>
          </div>
        </div>
      </div>

      {connectionError && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                <AlertTriangle size={20} />
             </div>
             <div>
                <h4 className="text-xs font-black text-amber-900 uppercase">Rede em Standby</h4>
                <p className="text-[9px] font-bold text-amber-700 uppercase">O banco master está offline ou o domínio não foi autorizado. Seus dados estão sendo salvos localmente.</p>
             </div>
          </div>
          <button onClick={loadAllData} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700">Tentar Sincronizar</button>
        </div>
      )}

      {renderContent()}
    </Layout>
  );
};
