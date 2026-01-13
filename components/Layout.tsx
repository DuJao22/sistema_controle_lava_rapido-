
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, TrendingDown, ClipboardList, Car, Users, LogOut, Shield, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [userName, setUserName] = useState(localStorage.getItem('lavarapido_user_name') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('lavarapido_user_role') || '');

  const handleLogout = () => {
    localStorage.removeItem('lavarapido_user_id');
    localStorage.removeItem('lavarapido_user_name');
    localStorage.removeItem('lavarapido_user_role');
    window.location.reload();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'billing', label: 'Vendas', icon: Receipt },
    { id: 'expenses', label: 'Gastos', icon: TrendingDown },
    { id: 'reports', label: 'Relatórios', icon: ClipboardList },
  ];

  if (userRole === 'admin') {
    menuItems.push({ id: 'users', label: 'Equipe', icon: Users });
  }

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
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Master Admin</span>
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
          <div className="bg-slate-800/40 p-4 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${userRole === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-400'}`}>
                {userRole === 'admin' ? <Shield size={16} /> : <UserIcon size={16} />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black truncate">{userName}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{userRole}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              <LogOut size={12} /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-10 pb-24 lg:pb-10 w-full overflow-x-hidden">
        {/* Header Mobile */}
        <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">@{userName}</span>
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg"><Car size={16} className="text-white" /></div>
                <h1 className="font-black text-slate-800 uppercase text-xs">Lava Rápido</h1>
              </div>
           </div>
           <button onClick={handleLogout} className="p-2 text-rose-500 bg-rose-50 rounded-xl"><LogOut size={18} /></button>
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
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px] ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
