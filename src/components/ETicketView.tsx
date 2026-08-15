import React, { useState } from 'react';
import { Booking, SEAT_CLASS_LABELS, PASSENGER_TYPE_DISCOUNTS } from '../types';
import { Printer, Mail, Bell, CheckCircle2, QrCode, Train, Calendar, Clock, MapPin, User, FileText, Share2, Sparkles } from 'lucide-react';

interface ETicketViewProps {
  booking: Booking;
  onOpenEmailPreview?: () => void;
}

export const ETicketView: React.FC<ETicketViewProps> = ({
  booking,
  onOpenEmailPreview
}) => {
  const [reminderEnabled, setReminderEnabled] = useState(booking.reminderEnabled);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    setEmailSending(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/send-email`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMessage(`Đã gửi vé điện tử đến ${booking.contact.email}`);
        if (onOpenEmailPreview) onOpenEmailPreview();
      }
    } catch (e) {
      console.error(e);
      setEmailMessage('Không thể gửi mail');
    } finally {
      setEmailSending(false);
      setTimeout(() => setEmailMessage(''), 4000);
    }
  };

  const toggleReminder = async () => {
    const newRem = !reminderEnabled;
    setReminderEnabled(newRem);
    try {
      await fetch(`/api/bookings/${booking.id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderEnabled: newRem })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Alert */}
      <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold">VÉ ĐIỆN TỬ ĐÃ ĐƯỢC XUẤT THÀNH CÔNG!</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Mã đặt chỗ PNR: <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">{booking.pnr}</span> - Đã xác nhận thanh toán.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleResendEmail}
            disabled={emailSending}
            className="text-xs bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-3 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4 text-emerald-700" />
            <span>{emailSending ? 'Đang gửi...' : 'Gửi lại Mail'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="text-xs bg-emerald-900 text-white hover:bg-emerald-950 font-bold px-3 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In / Tải PDF</span>
          </button>
        </div>
      </div>

      {emailMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{emailMessage}</span>
          {onOpenEmailPreview && (
            <button
              onClick={onOpenEmailPreview}
              className="underline text-blue-900 font-bold hover:text-blue-950"
            >
              Mở hộp thư xem email mẫu
            </button>
          )}
        </div>
      )}

      {/* Main Electronic Ticket Ticket Layout Card */}
      <div id="printable-e-ticket" className="bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden print:shadow-none print:border-slate-800">
        {/* Ticket Header */}
        <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
            <Train className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest mb-1">
                <span>TỔNG CÔNG TY ĐƯỜNG SẮT VIỆT NAM</span>
                <span>•</span>
                <span>TỔNG CÔNG TY VẬN TẢI</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                THẺ LÊN TÀU HỎA ĐIỆN TỬ
              </h2>
              <p className="text-xs text-slate-400 mt-1">E-BOARDING PASS / TRAIN TICKET</p>
            </div>

            {/* PNR Code badge */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Mã đặt chỗ (PNR)</span>
              <span className="font-mono text-xl font-extrabold text-red-400 tracking-wider">
                {booking.pnr}
              </span>
            </div>
          </div>
        </div>

        {/* Route Details & QR Code Bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Route info */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-xs font-semibold text-slate-500 uppercase">Ga Đi</span>
                <p className="text-xl font-extrabold text-slate-900">{booking.origin}</p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-2">
                {booking.trainCode && (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full mb-1">
                    {booking.trainCode}
                  </span>
                )}
                <div className="w-full h-0.5 bg-slate-300 relative flex items-center justify-center">
                  <Train className="w-4 h-4 text-slate-600 bg-slate-50 px-0.5" />
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  {booking.tripType === 'round_trip' ? 'Khứ hồi' : 'Một chiều'}
                </span>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-xs font-semibold text-slate-500 uppercase">Ga Đến</span>
                <p className="text-xl font-extrabold text-slate-900">{booking.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Ngày đi:</span>
                <span className="font-bold text-slate-900">{booking.departureDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hạng chỗ:</span>
                <span className="font-bold text-red-600">{SEAT_CLASS_LABELS[booking.seatClass]?.label || 'Giường nằm mềm'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Số lượng chỗ:</span>
                <span className="font-bold text-slate-900">
                  {booking.selectedSeats?.length > 0
                    ? booking.selectedSeats.join(', ')
                    : `${booking.passengers?.length || 1} chỗ`}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-center">
            <div className="bg-white p-2.5 border-2 border-slate-900 rounded-xl shadow-sm">
              <svg className="w-28 h-28 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM35 5h10v10H35zM50 5h15v5H50zM35 20h20v5H35zM40 35h10v10H40zM60 35h15v5H60zM80 40h15v10H80zM35 60h10v15H35zM50 70h15v10H50zM70 70h10v20H70zM85 80h15v15H85z" />
              </svg>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 font-mono">
              Quét mã soát vé tại cổng soát vé tự động
            </span>
          </div>
        </div>

        {/* Passenger List Table */}
        <div className="p-6 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-red-600" />
            <span>Danh Sách Hành Khách & Chi Tiết Chỗ Lên Tàu</span>
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3">Số CMND/CCCD</th>
                  <th className="p-3">Đối Tượng</th>
                  <th className="p-3">Số Ghế / Giường</th>
                  <th className="p-3 text-right">Giá Vé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {booking.passengers.map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 uppercase">{p.name}</td>
                    <td className="p-3 font-mono">{p.documentId}</td>
                    <td className="p-3">{PASSENGER_TYPE_DISCOUNTS[p.type].label}</td>
                    <td className="p-3 font-bold text-red-600">{p.seatCode}</td>
                    <td className="p-3 text-right font-bold">{p.price.toLocaleString('vi-VN')} VNĐ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Contact Person & Payment Record */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Người đặt vé (Liên hệ):</span>
              <p>Họ tên: <strong className="text-slate-900">{booking.contact.name}</strong></p>
              <p>SĐT: <strong className="text-slate-900">{booking.contact.phone}</strong></p>
              <p>Email: <strong className="text-slate-900">{booking.contact.email}</strong></p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Thanh toán & Trạng thái:</span>
              <p>Phương thức: <strong className="uppercase text-slate-900">{booking.payment?.method || 'N/A'}</strong></p>
              <p>Mã giao dịch: <strong className="font-mono text-slate-900">{booking.payment?.transactionId || 'N/A'}</strong></p>
              <p>Tổng thanh toán: <strong className="text-red-600 text-sm font-extrabold">{booking.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
            </div>
          </div>
        </div>

        {/* Ticket Footer Notes */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>* Quý khách vui lòng có mặt tại ga trước giờ tàu chạy ít nhất 30 phút và mang theo giấy tờ tùy thân gốc.</span>
          <span className="font-semibold text-slate-700">Đường Sắt Việt Nam • Tổng đài CSKH: 1900 1520</span>
        </div>
      </div>

      {/* Train Departure Reminder Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-amber-950 text-sm">
              Cài Đặt Thông Báo Nhắc Nhở Chuyến Tàu Khởi Hành
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Tự động gửi thông báo qua SMS/Email trước 24 giờ và trước 3 giờ đến giờ tàu chạy.
            </p>
          </div>
        </div>

        <button
          onClick={toggleReminder}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            reminderEnabled
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {reminderEnabled ? '✓ Đã Bật Nhắc Nhở' : '+ Bật Nhắc Nhở'}
        </button>
      </div>
    </div>
  );
};
