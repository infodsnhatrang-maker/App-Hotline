import React from 'react';
import { Booking, SEAT_CLASS_LABELS } from '../types';
import { Mail, X, Train, CheckCircle2, QrCode } from 'lucide-react';

interface EmailSimulatorModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const EmailSimulatorModal: React.FC<EmailSimulatorModalProps> = ({
  booking,
  onClose
}) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Email Header Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-500" />
            <span className="font-bold text-sm">HỘP THƯ EMAIL MÔ PHỎNG (SIMULATED EMAIL PREVIEW)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Meta Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs space-y-1.5 text-slate-700">
          <div className="flex justify-between">
            <span>Người gửi:</span>
            <span className="font-bold text-slate-900">Tổng Công ty Đường Sắt Việt Nam &lt;vetau@dsvn.vn&gt;</span>
          </div>
          <div className="flex justify-between">
            <span>Người nhận:</span>
            <span className="font-bold text-slate-900">{booking.contact.name} &lt;{booking.contact.email}&gt;</span>
          </div>
          <div className="flex justify-between">
            <span>Tiêu đề:</span>
            <span className="font-bold text-red-600">[CN VTĐS NHA TRANG] Xác nhận đặt vé tàu điện tử thành công - Mã PNR: {booking.pnr}</span>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-6 text-slate-800 space-y-4 max-h-[60vh] overflow-y-auto font-sans text-sm">
          <div className="text-center pb-4 border-b border-slate-200 space-y-1">
            <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2">
              <Train className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">XÁC NHẬN VÉ TÀU ĐIỆN TỬ PNR: {booking.pnr}</h2>
            <p className="text-xs text-slate-500">Cảm ơn quý khách đã sử dụng dịch vụ đặt vé trực tuyến Vết Tàu Việt!</p>
          </div>

          <p className="text-xs">
            Kính gửi <strong>{booking.contact.name}</strong>,
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            Đơn đặt vé tàu hỏa của quý khách đã được xác nhận thành công. Dưới đây là thông tin thẻ lên tàu điện tử của quý khách:
          </p>

          {/* Ticket Info Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 font-semibold">
              <div>
                <span className="text-slate-500 block">Hành trình:</span>
                <span className="text-slate-900">{booking.origin} → {booking.destination}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tàu & Ngày đi:</span>
                <span className="text-slate-900">{booking.trainCode} ({booking.departureDate})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Loại chỗ:</span>
                <span className="text-red-600">{SEAT_CLASS_LABELS[booking.seatClass].label}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Số chỗ:</span>
                <span className="text-slate-900">{booking.selectedSeats.join(', ')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block mb-1">Danh sách hành khách:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                {booking.passengers.map((p, i) => (
                  <li key={i}>
                    <strong>{p.name}</strong> - CMND/CCCD: {p.documentId} ({p.seatCode})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-900 space-y-1">
            <p className="font-bold">MÃ SOÁT VÉ ĐIỆN TỬ (QR CODE):</p>
            <div className="bg-white p-2 rounded inline-block mx-auto border border-red-300">
              <svg className="w-20 h-20 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM35 5h10v10H35zM50 5h15v5H50zM35 20h20v5H35zM40 35h10v10H40zM60 35h15v5H60zM80 40h15v10H80zM35 60h10v15H35zM50 70h15v10H50zM70 70h10v20H70zM85 80h15v15H85z" />
              </svg>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">PNR: {booking.pnr}</p>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
            Trân trọng,<br />
            <strong>Đội ngũ Chăm Sóc Khách Hàng - Vết Tàu Việt</strong>
          </div>
        </div>

        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-800 transition-colors"
          >
            Đóng xem email
          </button>
        </div>
      </div>
    </div>
  );
};
