import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { BookingForm } from './components/BookingForm';
import { MyBookingsView } from './components/MyBookingsView';
import { StaffAdminPortal } from './components/StaffAdminPortal';
import { EmailSimulatorModal } from './components/EmailSimulatorModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { Booking, AppUser } from './types';
import { Train, Sparkles, FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, Database, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'booking' | 'my_tickets' | 'staff_admin' | 'ai_assistant'>('booking');
  const [pnrSearch, setPnrSearch] = useState('');

  // Authentication State for Admin / Hotline Staff
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('railway_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginUser = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('railway_admin_user', JSON.stringify(user));
  };

  const handleLogoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('railway_admin_user');
  };

  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [emailModalBooking, setEmailModalBooking] = useState<Booking | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [resetContactTrigger, setResetContactTrigger] = useState(0);
  const [pendingStaffCount, setPendingStaffCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);

  const fetchBookingsForSync = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBookingsList(data);
      }
    } catch (e) {
      console.error('Error fetching bookings for sync:', e);
    }
  };

  React.useEffect(() => {
    if (showSheetModal) {
      fetchBookingsForSync();
    }
  }, [showSheetModal]);

  React.useEffect(() => {
    const savedWebhook = localStorage.getItem('GOOGLE_SHEET_WEBHOOK');
    if (savedWebhook && savedWebhook.startsWith('http')) {
      fetch('/api/sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: savedWebhook })
      }).catch(err => console.warn('Sync webhook URL with server failed:', err));
    }
  }, []);

  const SHEET_ID = '1K2sxxYYK5ltBbWc6lXNIXBVkLxGjvIC_VRmzsyY7C0U';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  // Submit Booking Order from BookingForm
  const handleBookingSubmit = async (bookingData: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...bookingData,
        trainCode: bookingData.trainCode || '',
        selectedSeats: [],
        webhookUrl: localStorage.getItem('GOOGLE_SHEET_WEBHOOK') || ''
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setCreatedBooking(data);
        setShowSuccessModal(true);
        // Keep active tab on booking screen so that the form is ready for subsequent bookings with intact details
        setActiveTab('booking');
      } else {
        alert(data.error || 'Tạo đơn đặt vé thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối đến máy chủ đặt vé');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PNR Search Action from Header
  const handleSearchPnr = () => {
    if (!pnrSearch.trim()) return;
    setActiveTab('my_tickets');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Top Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pnrSearch={pnrSearch}
        setPnrSearch={setPnrSearch}
        onSearchPnr={handleSearchPnr}
        pendingStaffCount={pendingStaffCount}
        currentUser={currentUser}
        onLogout={handleLogoutUser}
      />

      {/* Main Page Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-4 sm:space-y-8">
        {/* VIEW 1: CUSTOMER TICKET BOOKING FLOW */}
        {activeTab === 'booking' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Form Nhập Liệu Cho Hành Khách */}
            <BookingForm 
              onSubmitBooking={handleBookingSubmit} 
              isSubmitting={isSubmitting} 
              resetContactTrigger={resetContactTrigger}
            />
          </div>
        )}

        {/* VIEW 2: MY BOOKINGS & PERSONAL ACCOUNT */}
        {activeTab === 'my_tickets' && (
          <MyBookingsView
            initialSearchPnr={pnrSearch}
            onOpenEmailPreview={() => createdBooking && setEmailModalBooking(createdBooking)}
          />
        )}

        {/* VIEW 3: STAFF HOTLINE TELEPHONE BOOKING ADMIN PORTAL */}
        {activeTab === 'staff_admin' && (
          <StaffAdminPortal
            currentUser={currentUser}
            onLogin={handleLoginUser}
            onLogout={handleLogoutUser}
          />
        )}

        {/* VIEW 4: GEMINI AI ASSISTANT */}
        {activeTab === 'ai_assistant' && <AIAssistantWidget />}
      </main>

      {/* Email Inbox Preview Simulator Modal */}
      {emailModalBooking && (
        <EmailSimulatorModal
          booking={emailModalBooking}
          onClose={() => setEmailModalBooking(null)}
        />
      )}

      {/* Google Sheet Sync Modal */}
      {showSheetModal && (
        <GoogleSheetSyncModal
          bookings={bookingsList}
          onClose={() => setShowSheetModal(false)}
        />
      )}

      {/* Custom Booking Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Gửi Yêu Cầu Đặt Vé Thành Công!</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Đặt vé thành công, bộ phận chăm sóc khách hàng sẽ liên hệ quý khách hàng trong thời gian sớm nhất!
              </p>
            </div>

            <div className="pt-2">
              <button
                id="btn-close-success-modal"
                onClick={() => {
                  setShowSuccessModal(false);
                  setResetContactTrigger(prev => prev + 1);
                  setActiveTab('booking');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-98 transition-all text-sm cursor-pointer"
              >
                Đặt Tiếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE GOOGLE SHEET DATABASE PANEL - ONLY VISIBLE IF LOGGED IN AS ADMIN AND ON STAFF ADMIN TAB */}
      {activeTab === 'staff_admin' && currentUser?.role === 'admin' && (
        <div id="google-sheet-database-panel" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-10 mb-6">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
              {/* Info Column */}
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50">
                  <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-600/50">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      Cơ Sở Dữ Liệu Đám Mây Google Sheets
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/50 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Đang Kết Nối Trực Tiếp
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                    <span>File: DATABASE_VETAU_DSNHATRANG</span>
                    <span className="text-xs text-slate-400 font-normal">| 4 Bảng: DON_DAT_VE, HANH_KHACH, NHAT_KY_XU_LY, DM_GA_TAU</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono break-all">
                    🔗 Link Google Sheet: <a href={SHEET_URL} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 underline font-semibold">{SHEET_URL}</a>
                  </p>
                </div>
              </div>

              {/* Actions Column */}
              <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
                <button
                  id="btn-open-sync-modal"
                  onClick={() => setShowSheetModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-bold px-4 py-2.5 rounded-xl border border-emerald-500/50 transition-all text-xs active:scale-95 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>Bảng Điều Khiển & Đồng Bộ</span>
                </button>

                <a
                  id="btn-open-google-sheet"
                  href={SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all text-xs active:scale-95 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                >
                  <span>MỞ GOOGLE SHEET</span>
                  <ExternalLink className="w-4 h-4 text-slate-950" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-blue-200/90 border-t border-blue-800/50 py-8 mt-6 mb-16 md:mb-0 text-xs">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
            <Train className="w-4 h-4 text-sky-400" />
            <span>CN VTĐS NHA TRANG - BÁN VÉ TÀU HỎA ĐIỆN TỬ</span>
          </div>
          <p className="text-blue-200/80">Tích hợp thanh toán trực tuyến, tự động gửi email vé PNR, nhắc nhở lịch trình & phần quản trị cho nhân viên bán vé điện thoại.</p>
          <p className="text-blue-400/60">© 2026 Đường Sắt Việt Nam. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
