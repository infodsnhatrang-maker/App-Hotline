import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, StaffProcessingLog, SEAT_CLASS_LABELS, AppUser } from '../types';
import { Phone, CheckCircle2, Clock, ShieldCheck, User, Search, RefreshCw, AlertCircle, MessageSquare, Save, History, FileText, FileSpreadsheet, ExternalLink, LogOut, UserCheck, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { GoogleSheetSyncModal } from './GoogleSheetSyncModal';
import { AdminLogin } from './AdminLogin';

interface StaffAdminPortalProps {
  currentUser: AppUser | null;
  onLogin: (user: AppUser) => void;
  onLogout: () => void;
}

export const StaffAdminPortal: React.FC<StaffAdminPortalProps> = ({
  currentUser,
  onLogin,
  onLogout
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSheetModal, setShowSheetModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Deletion states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Processing Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [staffName, setStaffName] = useState(currentUser?.fullName || 'NV. Nguyễn Thị Hoa (Mã 105)');
  const [processNote, setProcessNote] = useState('');
  const [isCompletedChoice, setIsCompletedChoice] = useState<boolean>(true); // true = xong kết thúc, false = chưa kết thúc chờ tìm tiếp
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser?.fullName) {
      setStaffName(currentUser.fullName);
    }
  }, [currentUser]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
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
    if (currentUser) {
      fetchBookings();
    }
  }, [currentUser]);

  // If user is not logged in, render the secure Login Screen
  if (!currentUser) {
    return <AdminLogin onLoginSuccess={onLogin} />;
  }

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    if (!staffName.trim() || !processNote.trim()) {
      alert('Vui lòng nhập đầy đủ tên nhân viên và nội dung ghi chú xử lý');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: staffName.trim(),
          isCompleted: isCompletedChoice,
          note: processNote.trim(),
          webhookUrl: localStorage.getItem('GOOGLE_SHEET_WEBHOOK') || ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAlertMessage({
          type: 'success',
          text: data.message || 'Đã ghi lại kết quả xử lý thành công!'
        });
        setSelectedBooking(null);
        setProcessNote('');
        fetchBookings();
      } else {
        setAlertMessage({ type: 'error', text: data.error || 'Cập nhật thất bại' });
      }
    } catch (e) {
      console.error(e);
      setAlertMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setAlertMessage(null), 5000);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}?webhookUrl=${encodeURIComponent(localStorage.getItem('GOOGLE_SHEET_WEBHOOK') || '')}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMessage({
          type: 'success',
          text: data.message || 'Đã xóa đơn hàng thành công!'
        });
        setDeletingId(null);
        fetchBookings();
      } else {
        setAlertMessage({ type: 'error', text: data.error || 'Xóa đơn hàng thất bại' });
      }
    } catch (e) {
      console.error(e);
      setAlertMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.contact.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterStatus === 'pending') {
      return b.status === 'pending_staff_search' || b.status === 'searching_continued';
    }
    if (filterStatus === 'notified') {
      return b.status === 'notified_has_seat';
    }
    if (filterStatus === 'paid') {
      return b.status === 'paid';
    }
    return true; // 'all'
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Alert Header Toast */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage(null)} className="text-xs underline">
            Đóng
          </button>
        </div>
      )}

      {/* Header Banner with User Profile & Role Badges */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-amber-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              HOTLINE & QUẢN TRỊ BÁN VÉ
            </span>

            {currentUser.role === 'admin' ? (
              <span className="text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Quyền: Quản Trị Viên (Admin)
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-400/40">
                Quyền: Nhân Viên Hotline (Staff)
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">Xử Lý & Kiểm Tra Yêu Cầu Tìm Vé Tàu</h2>
          <div className="flex items-center gap-2 text-xs text-amber-200/90 flex-wrap">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              Tài khoản đang đăng nhập: <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.username})
            </span>
            {currentUser.branch && (
              <span className="text-slate-400 font-normal">| {currentUser.branch}</span>
            )}
          </div>
        </div>

        {/* Action Controls & Logout */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* Only ADMIN can see and open Database Google Sheets */}
          {currentUser.role === 'admin' && (
            <button
              id="btn-admin-google-sheet-modal"
              onClick={() => setShowSheetModal(true)}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-emerald-500/40 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Database Google Sheets</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </button>
          )}

          <button
            onClick={fetchBookings}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 border border-slate-700 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={onLogout}
            title="Đăng xuất khỏi hệ thống quản trị"
            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-500/40 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
          >
            <LogOut className="w-4 h-4 text-red-300" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ tìm vé ({bookings.filter(b => b.status === 'pending_staff_search' || b.status === 'searching_continued').length})
            </button>

            <button
              onClick={() => setFilterStatus('notified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'notified'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã báo có vé ({bookings.filter(b => b.status === 'notified_has_seat').length})
            </button>

            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'paid'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã thanh toán ({bookings.filter(b => b.status === 'paid').length})
            </button>

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'all'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({bookings.length})
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo PNR / Tên / SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Đang tải dữ liệu xử lý...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
            <Phone className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-bold text-slate-800">Không có đơn đặt vé nào phù hợp với bộ lọc</p>
          </div>
        ) : (
          paginatedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4 hover:border-amber-400 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm bg-slate-900 text-amber-400 px-3 py-1 rounded-lg">
                    {booking.pnr}
                  </span>
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

                <div className="flex items-center gap-2">
                  {booking.status === 'pending_staff_search' && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Khách Chờ Hotline Tìm Vé
                    </span>
                  )}
                  {booking.status === 'searching_continued' && (
                    <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Tiếp Tục Tìm Chỗ
                    </span>
                  )}
                  {booking.status === 'notified_has_seat' && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã Báo Có Vé (Kết Thúc)
                    </span>
                  )}
                  {booking.status === 'paid' && (
                    <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                      Đã Thanh Toán
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Contact & Passenger Info */}
              {(() => {
                const seatClassInfo = SEAT_CLASS_LABELS[booking.seatClass]?.label || 'Giường nằm mềm (Khoang 4)';
                const totalTickets = booking.passengers?.length || booking.selectedSeats?.length || 1;
                const adultCount = booking.passengers?.filter(p => p.type === 'adult').length || totalTickets;
                const childCount = booking.passengers?.filter(p => p.type === 'child').length || 0;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Khách hàng chính liên hệ:</span>
                      <p className="font-bold text-slate-900 text-sm">{booking.contact.name}</p>
                      <p className="text-amber-900 font-bold mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-700" />
                        <a href={`tel:${booking.contact.phone}`} className="underline">{booking.contact.phone}</a>
                      </p>
                      <p className="text-slate-600 mt-0.5">{booking.contact.email}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Loại chỗ & số lượng khách chọn:</span>
                      <p className="font-bold text-blue-950 text-sm">{totalTickets} vé {seatClassInfo}</p>
                      <p className="text-slate-600 mt-0.5">
                        ({adultCount} người lớn{childCount > 0 ? `, ${childCount} trẻ em` : ''})
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Yêu cầu vị trí / Ghi chú ban đầu:</span>
                      <p className="text-slate-800 bg-white p-2 rounded border border-amber-200 italic">
                        "{booking.contact.note || 'Không có ghi chú thêm'}"
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Audit Processing History Timeline */}
              {booking.processingLogs && booking.processingLogs.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Lịch Sử Thao Tác Của Nhân Viên Bán Vé:</span>
                  </div>

                  <div className="space-y-2 pl-2 border-l-2 border-amber-400">
                    {booking.processingLogs.map((log) => (
                      <div key={log.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{log.staffName}</span>
                          <span className="text-slate-400 font-normal">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{log.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process Action Button */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {currentUser?.role === 'admin' && (
                    deletingId === booking.id ? (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                        <span className="text-[11px] text-red-700 font-extrabold">Xác nhận xóa đơn {booking.pnr}?</span>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition-all cursor-pointer"
                        >
                          Xác Nhận Xóa
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(booking.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Xóa Đơn Đặt Vé</span>
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setProcessNote('');
                    setIsCompletedChoice(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4" />
                  <span>Cập Nhật Kết Quả Gọi Báo Khách & Tìm Vé</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controller */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-xs">
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
                className="bg-slate-50 border border-slate-300 rounded-lg p-1 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
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
                        ? 'bg-amber-600 text-white shadow-sm'
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

      {/* Staff Action Processing Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-amber-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Cập Nhật Thao Tác Xử Lý Đơn {selectedBooking.pnr}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-300 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessSubmit} className="p-6 space-y-5">
              {/* Customer summary */}
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1">
                <p>Khách hàng: <strong className="text-slate-900">{selectedBooking.contact.name}</strong> - SĐT: <strong className="text-amber-900 font-mono text-sm">{selectedBooking.contact.phone}</strong></p>
                <p>Tàu: <strong>{selectedBooking.trainCode}</strong> ({selectedBooking.origin} → {selectedBooking.destination}) - Ngày đi: <strong>{selectedBooking.departureDate}</strong></p>
              </div>

              {/* Staff Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên / Mã Nhân Viên Xử Lý *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Process Outcome Selection (Requirements: "nếu xong thì kết thúc, còn trường hợp chưa kết thúc chờ để tìm tiếp thì vẫn tiếp tục chờ") */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Hướng Xử Lý / Kết Quả Cuộc Gọi *
                </label>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isCompletedChoice
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="isCompleted"
                      checked={isCompletedChoice === true}
                      onChange={() => setIsCompletedChoice(true)}
                      className="mt-1 text-emerald-600 accent-emerald-600"
                    />
                    <div>
                      <span className="text-sm font-bold block text-emerald-900">
                        ✅ Xử lý xong (Đã liên hệ báo khách có vé - Kết thúc quy trình)
                      </span>
                      <span className="text-xs text-slate-600 font-normal">
                        Hệ thống ghi nhận nhân viên đã thông báo giữ chỗ có vé thành công. Chuyển đơn sang trạng thái sẵn sàng để khách thanh toán.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      !isCompletedChoice
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="isCompleted"
                      checked={isCompletedChoice === false}
                      onChange={() => setIsCompletedChoice(false)}
                      className="mt-1 text-indigo-600 accent-indigo-600"
                    />
                    <div>
                      <span className="text-sm font-bold block text-indigo-900">
                        ⏳ Chưa kết thúc (Lưu kết quả & Tiếp tục chờ tìm chỗ)
                      </span>
                      <span className="text-xs text-slate-600 font-normal">
                        Trường hợp chưa có chỗ hoặc đang chờ cập nhật hệ thống. Đơn tiếp tục giữ trong danh sách chờ để ca sau / lượt sau tiếp tục tìm vé cho khách.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Note Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội Dung Ghi Chú Xử Lý Chi Tiết *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="VD: Đã gọi điện cho khách lúc 15:30. Khách yêu cầu tầng 1 khoang 4, hiện toa 2 còn giường 03. Khách đồng ý giữ vé và sẽ thanh toán..."
                  value={processNote}
                  onChange={(e) => setProcessNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Đang lưu...' : 'Lưu Vết Thao Tác & Cập Nhật'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheet Sync Modal */}
      {showSheetModal && (
        <GoogleSheetSyncModal
          bookings={bookings}
          onClose={() => setShowSheetModal(false)}
          onSyncComplete={fetchBookings}
        />
      )}
    </div>
  );
};
