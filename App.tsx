
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillingForm } from './components/BillingForm';
import { ExpenseForm } from './components/ExpenseForm';
import { Reports } from './components/Reports';
import { getBillings, getExpenses } from './lib/storage';
import { Billing, Expense } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [billings, setBillings] = useState<Billing[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Update lists whenever tab changes to ensure fresh data from localStorage
  useEffect(() => {
    setBillings(getBillings());
    setExpenses(getExpenses());
  }, [activeTab]);

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

export default App;
