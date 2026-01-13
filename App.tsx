
import * as React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillingForm } from './components/BillingForm';
import { ExpenseForm } from './components/ExpenseForm';
import { Reports } from './components/Reports';
import { initDB, getBillings, getExpenses, checkForUpdates } from './lib/storage';
import { Billing, Expense } from './types';
import { Loader2, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
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
    const setup = async () => {
      await initDB();
      setIsDbReady(true);
      refreshLocalData();
    };
    setup();
  }, []);

  // Monitoramento em Tempo Real (Polling de 10 segundos)
  React.useEffect(() => {
    if (!isDbReady) return;

    const syncInterval = setInterval(async () => {
      setIsSyncing(true);
      const hasNewData = await checkForUpdates();
      if (hasNewData) {
        refreshLocalData();
        console.log("Dados sincronizados da nuvem com sucesso.");
      }
      setIsSyncing(false);
    }, 10000); // 10 segundos é o equilíbrio ideal entre "tempo real" e economia de bateria/dados

    return () => clearInterval(syncInterval);
  }, [isDbReady]);

  // Recarrega dados ao trocar de aba apenas para segurança visual
  React.useEffect(() => {
    if (isDbReady) refreshLocalData();
  }, [activeTab, isDbReady]);

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 gap-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-white font-black text-xl tracking-tighter uppercase">Lava Rápido Pro</h2>
          <p className="text-slate-500 font-bold text-xs animate-pulse mt-1 uppercase tracking-widest">Sincronizando Banco de Dados...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard billings={billings} expenses={expenses} />;
      case 'billing':
        return <BillingForm />;
      case 'expenses':
        return <ExpenseForm />;
      case 'reports':
        return <Reports billings={billings} expenses={expenses} />;
      default:
        return <Dashboard billings={billings} expenses={expenses} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Indicador de Sincronização Sutil */}
      {isSyncing && (
        <div className="fixed top-6 right-6 z-50 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <RefreshCw size={12} className="text-blue-400 animate-spin" />
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Sincronizando nuvem</span>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};
