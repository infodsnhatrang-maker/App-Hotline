import React, { useState, useEffect } from 'react';
import { Booking, SEAT_CLASS_LABELS } from '../types';
import { Search, Train, Calendar, User, Phone, Mail, Clock, Ticket, Bell, FileText, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { ETicketView } from './ETicketView';

interface MyBookingsViewProps {
  initialSearchPnr?: string;
  onOpenEmailPreview?: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  initialSearchPnr = '',
  onOpenEmailPreview
}) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Captcha security state
  const [captchaCode, setCaptchaCode] = useState(() => Math.floor(10000 + Math.random() * 90000).toString());
  const [captchaTargetIndex, setCaptchaTargetIndex] = useState(() => Math.floor(Math.random() * 5) + 1);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Reset page when search criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [phone, email]);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(Math.floor(10000 + Math.random() * 90000).toString());
    setCaptchaTargetIndex(Math.floor(Math.random() * 5) + 1);
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchPhone = phone.trim();
    const searchEmail = email.trim();

    if (!searchPhone && !searchEmail) {
      alert('Vui lòng nhập Số điện thoại hoặc Email để tìm vé!');
      return;
    }

    // Capture user input and match with specific digit of captcha code
    const correctDigit = captchaCode[captchaTargetIndex - 1];
    if (captchaInput.trim() !== correctDigit) {
      setCaptchaError(`Xác thực sai! Hãy nhập chính xác chữ số thứ ${captchaTargetIndex} của mã ${captchaCode}.`);
      handleRefreshCaptcha();
      return;
    }

    setCaptchaError('');
    setLoading(true);
    setHasSearched(true);
    
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter bookings by exact/partial match on phone or email
        const filtered = data.filter(b => {
          const matchPhone = searchPhone ? b.contact.phone.includes(searchPhone) : true;
          const matchEmail = searchEmail ? b.contact.email.toLowerCase().includes(searchEmail.toLowerCase()) : true;
          
          if (searchPhone && searchEmail) {
            return b.contact.phone.includes(searchPhone) && b.contact.email.toLowerCase().includes(searchEmail.toLowerCase());
          } else if (searchPhone) {
            return b.contact.phone.includes(searchPhone);
          } else if (searchEmail) {
            return b.contact.email.toLowerCase().includes(searchEmail.toLowerCase());
          }
          return false;
        });
        setBookings(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán - Vé điện tử</span>;
      case 'pending_payment':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Chờ thanh toán</span>;
      case 'pending_staff_search':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Chờ nhân viên tìm vé</span>;
      case 'notified_has_seat':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Nhân viên đã báo có vé</span>;
      case 'searching_continued':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Đang tiếp tục chờ tìm vé</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">Hoàn thành</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 border border-red-300 text-xs font-bold px-2.5 py-1 rounded-full">Đã hủy</span>;
    }
  };

  if (selectedBooking) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedBooking(null)}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          ← Quay lại danh sách lịch sử đặt vé
        </button>

        <ETicketView booking={selectedBooking} onOpenEmailPreview={onOpenEmailPreview} />
      </div>
    );
  }

  const totalItems = bookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = bookings.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Bar Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
              <span>Tìm kiếm Đơn đặt vé tàu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tra cứu thông tin vé điện tử, trạng thái nhân viên tìm vé, hoặc tải lại vé theo Số điện thoại và Email người đặt đơn.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Input 1: Số điện thoại */}
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                placeholder="Nhập số điện thoại người đặt..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            {/* Input 2: Email */}
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="Nhập email người đặt đơn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          {/* Captcha Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Captcha code display and refresh button */}
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <div className="bg-red-50 text-red-600 px-3.5 py-2 rounded-xl font-bold tracking-widest text-lg select-none border border-red-100 flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  <span>{captchaCode}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  title="Đổi mã bảo vệ khác"
                  className="p-2.5 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-sm flex-shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {/* Text instruction */}
              <div className="text-xs text-slate-600 leading-relaxed">
                Mã bảo vệ ngẫu nhiên: <span className="font-bold text-slate-800">{captchaCode}</span>.<br />
                Vui lòng nhập <span className="font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">chữ số thứ {captchaTargetIndex}</span> của mã trên vào ô:
              </div>
            </div>
            
            {/* Input field */}
            <div className="w-full md:w-32">
              <input
                type="text"
                maxLength={1}
                placeholder="Số cần nhập..."
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value.replace(/\D/g, ''));
                  setCaptchaError('');
                }}
                className="w-full text-center px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-inner placeholder:text-slate-400 placeholder:text-sm"
              />
            </div>
          </div>

          {captchaError && (
            <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {captchaError}
            </p>
          )}
          
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Tìm vé</span>
            </button>
          </div>
        </form>
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Đang tải lịch sử vé...</div>
        ) : !hasSearched ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-base">Vui lòng nhập thông tin để tìm kiếm vé</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nhập Số điện thoại hoặc Email người đặt bên trên để hiển thị chi tiết lịch trình và vé điện tử của bạn.
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Ticket className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-base">Chưa tìm thấy đơn đặt vé nào</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc tạo đơn đặt vé tàu mới để trải nghiệm tính năng xuất vé điện tử.
            </p>
          </div>
        ) : (
          paginatedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-50 text-red-600 font-extrabold text-sm font-mono border border-red-100">
                    PNR: {booking.pnr}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {booking.origin} → {booking.destination}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ngày đi: <strong>{booking.departureDate}</strong>
                      {booking.returnDate && (
                        <span> • Ngày về: <strong>{booking.returnDate}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {getStatusBadge(booking.status)}
                </div>
              </div>

              {/* Details & Passengers info */}
              {(() => {
                const seatClassInfo = SEAT_CLASS_LABELS[booking.seatClass]?.label || 'Giường nằm mềm (Khoang 4)';
                const totalTickets = booking.passengers?.length || booking.selectedSeats?.length || 1;
                const adultCount = booking.passengers?.filter(p => p.type === 'adult').length || totalTickets;
                const childCount = booking.passengers?.filter(p => p.type === 'child').length || 0;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Hành khách chính:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {booking.contact.name} ({booking.contact.phone})
                      </span>
                      {booking.contact.email && (
                        <span className="text-slate-400 block text-[11px] mt-0.5">{booking.contact.email}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Số lượng & loại chỗ đã chọn:</span>
                      <span className="font-bold text-blue-900 text-sm block">
                        {totalTickets} vé {seatClassInfo}
                      </span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        ({adultCount} người lớn{childCount > 0 ? `, ${childCount} trẻ em` : ''})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Processing Logs Timeline removed as per user request */}

              {/* Card Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Tạo ngày: {booking.createdAt}
                </span>

                <div className="flex items-center gap-2">
                  {booking.status === 'paid' && (
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1"
                    >
                      <span>Xem Vé Điện Tử</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controller */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-xs mt-4">
          <div className="text-slate-500 font-medium">
            Hiển thị <span className="font-bold text-slate-800">{Math.min(startIndex + 1, totalItems)}</span> -{' '}
            <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</span> trong số{' '}
            <span className="font-bold text-slate-800">{totalItems}</span> đơn đặt vé
          </div>

          <div className="flex items-center gap-2">
            {/* Items per page selection */}
            <div className="flex items-center gap-1.5 mr-2 text-slate-500">
              <span>Số dòng:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg p-1 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 6 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 && currentPage > 4) {
                    return <span key="dots-start" className="px-1 text-slate-400">...</span>;
                  }
                  if (pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                    return <span key="dots-end" className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
