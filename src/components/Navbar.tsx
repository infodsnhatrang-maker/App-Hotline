import React from 'react';
import { Train, Ticket, User, ShieldCheck, Bot, Bell, Search, FileSpreadsheet, ExternalLink, LogOut } from 'lucide-react';
import { AppUser } from '../types';

interface NavbarProps {
  activeTab: 'booking' | 'my_tickets' | 'staff_admin' | 'ai_assistant';
  setActiveTab: (tab: 'booking' | 'my_tickets' | 'staff_admin' | 'ai_assistant') => void;
  pnrSearch: string;
  setPnrSearch: (val: string) => void;
  onSearchPnr: () => void;
  pendingStaffCount: number;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pnrSearch,
  setPnrSearch,
  onSearchPnr,
  pendingStaffCount,
  currentUser,
  onLogout
}) => {
  return (
    <>
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-blue-800 to-sky-700 text-white shadow-lg border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
            {/* Logo & Brand */}
            <div
              onClick={() => setActiveTab('booking')}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform">
                <Train className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="font-extrabold text-sm sm:text-lg tracking-tight flex items-center gap-1.5 text-white whitespace-nowrap">
                  <span>CN VTĐS NHA TRANG</span>
                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-extrabold border border-white/40 uppercase tracking-wider">E-TICKET</span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium whitespace-nowrap">Hệ thống hỗ trợ đặt vé tàu nhanh</p>
              </div>
            </div>

            {/* Quick PNR Lookup in Header */}
            <div className="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-3 py-1.5 focus-within:border-white focus-within:ring-2 focus-within:ring-white/30 transition-all">
              <Search className="w-4 h-4 text-blue-100 shrink-0" />
              <input
                type="text"
                placeholder="Tra cứu mã vé PNR..."
                value={pnrSearch}
                onChange={(e) => setPnrSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchPnr()}
                className="bg-transparent text-xs sm:text-sm text-white placeholder-blue-100/70 focus:outline-none w-44 sm:w-56 font-medium"
              />
              <button
                onClick={onSearchPnr}
                className="text-xs bg-white text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all font-extrabold shadow-sm active:scale-95"
              >
                Tra
              </button>
            </div>

            {/* Navigation Links / View Switcher (Desktop & Tablet) */}
            <nav className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('booking')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'booking'
                    ? 'bg-white text-blue-900 shadow-md shadow-blue-950/20 font-extrabold'
                    : 'text-blue-100 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Ticket className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Đặt Vé Tàu</span>
              </button>

              <button
                onClick={() => setActiveTab('my_tickets')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'my_tickets'
                    ? 'bg-white text-blue-900 shadow-md shadow-blue-950/20 font-extrabold'
                    : 'text-blue-100 hover:bg-white/15 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Vé Của Tôi</span>
              </button>

              <button
                onClick={() => setActiveTab('staff_admin')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'staff_admin'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-900/30 font-extrabold'
                    : 'bg-white/10 text-amber-200 hover:bg-amber-500/30 hover:text-amber-100 border border-amber-300/40'
                }`}
                title="Cổng dành cho nhân viên bán vé điện thoại kiểm tra & xử lý đơn"
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-300" />
                <span className="whitespace-nowrap">Phần Quản Trị Hotline</span>
                {pendingStaffCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('ai_assistant')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'ai_assistant'
                    ? 'bg-sky-300 text-blue-950 shadow-md shadow-blue-950/20 font-extrabold'
                    : 'text-blue-100 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4 text-sky-200 shrink-0" />
                <span className="whitespace-nowrap">Trợ Lý AI</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for smartphones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-blue-950/95 backdrop-blur-lg border-t border-blue-800/60 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'booking'
                ? 'text-white font-extrabold bg-blue-600 shadow-sm'
                : 'text-blue-200/80 font-medium hover:text-white'
            }`}
          >
            <Ticket className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Đặt Vé</span>
          </button>

          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'my_tickets'
                ? 'text-white font-extrabold bg-blue-600 shadow-sm'
                : 'text-blue-200/80 font-medium hover:text-white'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Vé Của Tôi</span>
          </button>

          <button
            onClick={() => setActiveTab('staff_admin')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
              activeTab === 'staff_admin'
                ? 'text-slate-950 font-extrabold bg-amber-400 shadow-sm'
                : 'text-amber-200 font-medium hover:text-amber-100'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Quản Trị</span>
            {pendingStaffCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse absolute top-1 right-3" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ai_assistant')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'ai_assistant'
                ? 'text-blue-950 font-extrabold bg-sky-300 shadow-sm'
                : 'text-sky-200 font-medium hover:text-white'
            }`}
          >
            <Bot className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Trợ Lý AI</span>
          </button>
        </div>
      </div>
    </>
  );
};
