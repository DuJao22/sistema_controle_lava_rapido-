
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, TrendingDown, ClipboardList, Car, Cloud, ShieldCheck, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('lavarapido_last_sync'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync(localStorage.getItem('lavarapido_last_sync'));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'billing', label: 'Vendas', icon: Receipt },
    { id: 'expenses', label: 'Gastos', icon: TrendingDown },
    { id: 'reports', label: 'Relatórios', icon: ClipboardList },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white p-6 fixed h-full z-30 flex-col shadow-2xl">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Car size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none uppercase italic">Lava Rápido</h1>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cloud Ativa</span>
          </div>
        </div>
        
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.02]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-slate-800/50">
          <div className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizado</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Último Backup</p>
            <p className="text-xs text-slate-200 font-black">
              {lastSync ? new Date(lastSync).toLocaleTimeString('pt-BR') : 'Conectando...'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-10 pb-24 lg:pb-10 w-full overflow-x-hidden">
        {/* Header Mobile */}
        <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Car size={18} className="text-white" />
            </div>
            <h1 className="font-black text-slate-800 uppercase text-sm tracking-tighter">Lava Rápido Pro</h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase">Cloud Online</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex justify-around items-center z-40 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[70px] ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-50' : ''}`}>
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};
