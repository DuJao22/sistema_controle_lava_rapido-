
import React from 'react';
import { LayoutDashboard, Receipt, TrendingDown, ClipboardList, Car, Cloud, CloudOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSynced, setIsSynced] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Faturamento', icon: Receipt },
    { id: 'expenses', label: 'Despesas', icon: TrendingDown },
    { id: 'reports', label: 'Relatórios', icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 md:fixed h-auto md:h-full z-20 flex flex-col">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Car size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Lava Rápido Pro</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-2 py-3 bg-slate-800/50 rounded-xl">
            {isSynced ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Cloud size={18} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <CloudOff size={18} />
              </div>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Status de Rede</p>
              <p className="text-xs font-bold text-slate-200">Banco de Dados Global</p>
            </div>
          </div>

          <div className="px-2 text-[10px] text-slate-500">
            <p>SISTEMA V1.2 — CLOUD</p>
            <p className="mt-1">Desenvolvido por</p>
            <p className="font-bold text-slate-300">João Layón</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer / Mobile Credits */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 text-center text-xs text-slate-600 z-30">
        Plataforma Compartilhada — <span className="font-bold">João Layón</span>
      </footer>
    </div>
  );
};
