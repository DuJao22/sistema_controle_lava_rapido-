
import * as React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillingForm } from './components/BillingForm';
import { ExpenseForm } from './components/ExpenseForm';
import { Reports } from './components/Reports';
import { initDB, getBillings, getExpenses } from './lib/storage';
import { Billing, Expense } from './types';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [billings, setBillings] = React.useState<Billing[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isDbReady, setIsDbReady] = React.useState(false);

  // Inicializa o banco SQLite3 uma única vez
  React.useEffect(() => {
    const setup = async () => {
      await initDB();
      setIsDbReady(true);
      setBillings(getBillings());
      setExpenses(getExpenses());
    };
    setup();
  }, []);

  // Recarrega dados quando a aba muda (para garantir sincronia)
  React.useEffect(() => {
    if (isDbReady) {
      setBillings(getBillings());
      setExpenses(getExpenses());
    }
  }, [activeTab, isDbReady]);

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-600 font-bold animate-pulse">Carregando SQLite3...</p>
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
      {renderContent()}
    </Layout>
  );
};
