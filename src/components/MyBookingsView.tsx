import React, { useState, useEffect } from 'react';
import { Booking, SEAT_CLASS_LABELS } from '../types';
import { Search, Train, Calendar, User, Phone, Mail, Clock, Ticket, Bell, FileText, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { ETicketView } from './ETicketView';

interface MyBookingsViewProps {
  initialSearchPnr?: string;
  onOpenEmailPreview?: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  initialSearchPnr = '',
  onOpenEmailPreview
}) => {
  const [query, setQuery] = useState(initialSearchPnr);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const fetchBookings = async (searchQuery: string) => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/bookings?query=${encodeURIComponent(searchQuery)}`
        : '/api/bookings';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setBookings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(query);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(query);
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-red-600" />
              <span>Tài Khoản Cá Nhân & Lịch Sử Đặt Vé Tàu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tra cứu thông tin vé điện tử, trạng thái nhân viên tìm vé, hoặc tải lại vé theo mã PNR, số điện thoại, email.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Nhập Mã PNR hoặc Số Điện Thoại / Email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            Tìm vé
          </button>
        </form>
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Đang tải lịch sử vé...</div>
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
