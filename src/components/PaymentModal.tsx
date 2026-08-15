import React, { useState } from 'react';
import { Booking, PaymentMethod } from '../types';
import { QrCode, CreditCard, ShieldCheck, CheckCircle2, Loader2, X, Lock } from 'lucide-react';

interface PaymentModalProps {
  booking: Booking;
  onPaymentSuccess: (updatedBooking: Booking) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  booking,
  onPaymentSuccess,
  onClose
}) => {
  const [method, setMethod] = useState<PaymentMethod>('vietqr');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method })
      });
      const data = await res.json();
      if (res.ok) {
        onPaymentSuccess(data);
      } else {
        alert(data.error || 'Thanh toán thất bại');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối cổng thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-600 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Thanh Toán Vé Tàu Điện Tử</h3>
              <p className="text-xs text-slate-400">Mã PNR: <span className="font-mono font-bold text-red-400">{booking.pnr}</span></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 text-sm space-y-2">
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Hành trình:</span>
            <span className="font-bold text-slate-800">{booking.origin} → {booking.destination}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Tàu & Ngày đi:</span>
            <span className="font-bold text-slate-800">{booking.trainCode} ({booking.departureDate})</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Số lượng hành khách:</span>
            <span className="font-bold text-slate-800">{booking.passengers.length} người</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900">Tổng tiền thanh toán:</span>
            <span className="font-extrabold text-red-600 text-lg">
              {booking.totalAmount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-5 space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chọn phương thức thanh toán:
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* VietQR */}
            <button
              type="button"
              onClick={() => setMethod('vietqr')}
              className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                method === 'vietqr'
                  ? 'border-red-600 bg-red-50/50 text-red-950 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <QrCode className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">VietQR Code</p>
                <p className="text-[10px] text-slate-500">Chuyển khoản 24/7</p>
              </div>
            </button>

            {/* VNPay */}
            <button
              type="button"
              onClick={() => setMethod('vnpay')}
              className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                method === 'vnpay'
                  ? 'border-red-600 bg-red-50/50 text-red-950 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="w-5 h-5 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                VN
              </div>
              <div className="text-xs">
                <p className="font-bold">Cổng VNPay</p>
                <p className="text-[10px] text-slate-500">Ví / Thẻ nội địa</p>
              </div>
            </button>

            {/* MoMo */}
            <button
              type="button"
              onClick={() => setMethod('momo')}
              className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                method === 'momo'
                  ? 'border-red-600 bg-red-50/50 text-red-950 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="w-5 h-5 rounded bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                Mo
              </div>
              <div className="text-xs">
                <p className="font-bold">Ví MoMo</p>
                <p className="text-[10px] text-slate-500">Quét mã MoMo</p>
              </div>
            </button>

            {/* ATM / Credit Card */}
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                method === 'card'
                  ? 'border-red-600 bg-red-50/50 text-red-950 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Thẻ Visa / ATM</p>
                <p className="text-[10px] text-slate-500">Thanh toán quốc tế</p>
              </div>
            </button>
          </div>

          {/* VietQR View */}
          {method === 'vietqr' && (
            <div className="bg-slate-900 rounded-2xl p-4 text-white text-center space-y-3 mt-2 border border-slate-800">
              <p className="text-xs text-slate-300">
                Quét mã QR bằng ứng dụng ngân hàng bất kỳ để hoàn tất thanh toán
              </p>

              <div className="bg-white p-3 rounded-xl inline-block shadow-inner mx-auto">
                {/* SVG Mock QR Code */}
                <svg className="w-36 h-36 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM35 5h10v10H35zM50 5h15v5H50zM35 20h20v5H35zM40 35h10v10H40zM60 35h15v5H60zM80 40h15v10H80zM35 60h10v15H35zM50 70h15v10H50zM70 70h10v20H70zM85 80h15v15H85z" />
                </svg>
                <span className="text-[10px] text-slate-800 font-mono font-bold block mt-1">
                  MB BANK - 999888777 (DSE-TICKET)
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-300">
                <p>Nội dung chuyển khoản: <span className="font-mono font-bold text-amber-400 select-all">{booking.pnr}</span></p>
                <p>Số tiền: <span className="font-bold text-red-400">{booking.totalAmount.toLocaleString('vi-VN')} VNĐ</span></p>
              </div>
            </div>
          )}

          {/* Security Banner */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thanh toán mã hóa bảo mật 256-bit theo tiêu chuẩn Ngân Hàng Nhà Nước</span>
          </div>

          {/* Confirm Payment Action Button */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang kết nối ngân hàng xác nhận...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Xác Nhận Đã Thanh Toán {booking.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
