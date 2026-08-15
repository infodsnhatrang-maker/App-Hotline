import React, { useState, useMemo } from 'react';
import { PassengerDetail, PrimaryContact, PassengerType, PASSENGER_TYPE_DISCOUNTS } from '../types';
import { User, Users, Phone, Mail, IdCard, MessageSquare, PhoneCall, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateVietnamesePhone, validateEmail } from '../utils/validation';

interface PassengerFormProps {
  passengers: PassengerDetail[];
  setPassengers: React.Dispatch<React.SetStateAction<PassengerDetail[]>>;
  contact: PrimaryContact;
  setContact: React.Dispatch<React.SetStateAction<PrimaryContact>>;
  selectedSeatCodes: string[];
  basePrice: number;
  requestStaffSearch: boolean;
  setRequestStaffSearch: (val: boolean) => void;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  passengers,
  setPassengers,
  contact,
  setContact,
  selectedSeatCodes,
  basePrice,
  requestStaffSearch,
  setRequestStaffSearch
}) => {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const phoneValidation = useMemo(() => validateVietnamesePhone(contact.phone), [contact.phone]);
  const emailValidation = useMemo(() => validateEmail(contact.email), [contact.email]);
  // Update passenger details
  const updatePassenger = (index: number, field: keyof PassengerDetail, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate price if type changed
    if (field === 'type') {
      const discount = PASSENGER_TYPE_DISCOUNTS[value as PassengerType].discountRate;
      updated[index].price = Math.round(basePrice * (1 - discount));
    }

    setPassengers(updated);
  };

  // Add passenger
  const addPassenger = () => {
    const nextSeat = selectedSeatCodes[passengers.length] || `Chưa gán ghế ${passengers.length + 1}`;
    setPassengers([
      ...passengers,
      {
        id: 'p-' + (passengers.length + 1),
        name: '',
        documentId: '',
        type: 'adult',
        seatCode: nextSeat,
        price: basePrice
      }
    ]);
  };

  // Remove passenger
  const removePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Passenger List Form Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              <span>2. Thông Tin Chi Tiết Hành Khách Tàu</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập họ tên chính xác theo giấy tờ tùy thân (CMND/CCCD/Khai sinh) để đối soát khi lên tàu.
            </p>
          </div>

          <button
            onClick={addPassenger}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors self-start sm:self-auto"
          >
            + Thêm Hành Khách
          </button>
        </div>

        <div className="space-y-4">
          {passengers.map((passenger, idx) => (
            <div
              key={passenger.id || idx}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 relative space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-md">
                  Hành khách #{idx + 1} {passenger.seatCode ? `(${passenger.seatCode})` : ''}
                </span>

                {passengers.length > 1 && (
                  <button
                    onClick={() => removePassenger(idx)}
                    className="text-xs text-slate-400 hover:text-red-600 font-semibold"
                  >
                    Xóa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Full Name */}
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Họ và Tên Hành Khách *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: NGUYEN VAN A"
                    value={passenger.name}
                    onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* ID / Birth Certificate */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Số CMND / CCCD / Khai sinh *
                  </label>
                  <input
                    type="text"
                    placeholder="Số CMND/CCCD"
                    value={passenger.documentId}
                    onChange={(e) => updatePassenger(idx, 'documentId', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Passenger Category / Discount */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Đối tượng
                  </label>
                  <select
                    value={passenger.type}
                    onChange={(e) => updatePassenger(idx, 'type', e.target.value as PassengerType)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <option value="adult">Người lớn (100%)</option>
                    <option value="child">Trẻ em (Giảm 25%)</option>
                    <option value="senior">Cao tuổi (Giảm 15%)</option>
                    <option value="student">Sinh viên (Giảm 10%)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end text-xs font-semibold text-slate-700">
                Thành tiền vé: <span className="text-red-600 ml-1.5">{passenger.price.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Contact Details (Người Đặt Vé Chính) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="border-b border-slate-100 pb-3 mb-5">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            <span>3. Thông Tin Người Đặt (Hành Khách Chính Để Nhận Vé)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mã vé điện tử PNR và thông báo chuyến tàu sẽ được gửi trực tiếp tới SĐT & Email này.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contact Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Họ tên người liên hệ *
            </label>
            <input
              type="text"
              placeholder="VD: Nguyễn Văn An"
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Số điện thoại di động *</span>
              </label>
              {phoneTouched && phoneValidation.isValid && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Đúng SĐT VN
                </span>
              )}
            </div>
            <input
              type="tel"
              placeholder="VD: 0988123456"
              value={contact.phone}
              onChange={(e) => {
                setContact({ ...contact, phone: e.target.value });
                if (!phoneTouched) setPhoneTouched(true);
              }}
              onBlur={() => setPhoneTouched(true)}
              className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all focus:outline-none ${
                phoneTouched && !phoneValidation.isValid
                  ? 'bg-rose-50/40 border-2 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/30'
                  : phoneTouched && phoneValidation.isValid
                  ? 'bg-emerald-50/30 border-2 border-emerald-500/80 text-slate-900 focus:ring-2 focus:ring-emerald-400/30'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
              }`}
            />
            {phoneTouched && !phoneValidation.isValid ? (
              <p className="text-[10.5px] font-bold text-rose-600 mt-1 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{phoneValidation.error}</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">10 số di động VN (03x, 05x, 07x, 08x, 09x)</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email nhận vé điện tử *</span>
              </label>
              {emailTouched && emailValidation.isValid && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Email hợp lệ
                </span>
              )}
            </div>
            <input
              type="email"
              placeholder="VD: khachhang@gmail.com"
              value={contact.email}
              onChange={(e) => {
                setContact({ ...contact, email: e.target.value });
                if (!emailTouched) setEmailTouched(true);
              }}
              onBlur={() => setEmailTouched(true)}
              className={`w-full rounded-lg px-3 py-2.5 text-sm transition-all focus:outline-none ${
                emailTouched && !emailValidation.isValid
                  ? 'bg-rose-50/40 border-2 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/30'
                  : emailTouched && emailValidation.isValid
                  ? 'bg-emerald-50/30 border-2 border-emerald-500/80 text-slate-900 focus:ring-2 focus:ring-emerald-400/30'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
              }`}
            />
            {emailTouched && !emailValidation.isValid ? (
              <p className="text-[10.5px] font-bold text-rose-600 mt-1 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{emailValidation.error}</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">Gửi mã PNR và vé điện tử PDF về email này</p>
            )}
          </div>

          {/* Contact ID Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <IdCard className="w-3.5 h-3.5 text-slate-400" />
              Số CMND / CCCD
            </label>
            <input
              type="text"
              placeholder="Số căn cước công dân"
              value={contact.documentId}
              onChange={(e) => setContact({ ...contact, documentId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Note Field */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Ghi chú thêm (Mô tả vị trí giường mong muốn, giờ khởi hành hoặc yêu cầu đặc biệt)
            </label>
            <textarea
              rows={2}
              placeholder="VD: Cần 2 giường tầng 1 khoang 4, mang theo em bé 2 tuổi..."
              value={contact.note || ''}
              onChange={(e) => setContact({ ...contact, note: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        </div>

        {/* Telephone Staff Hotline Search Request Checkbox */}
        <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requestStaffSearch}
              onChange={(e) => setRequestStaffSearch(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-600 rounded accent-amber-600 focus:ring-amber-500"
            />
            <div>
              <div className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-amber-700" />
                <span>Yêu cầu Nhân viên Hotline gọi lại tư vấn & giữ vé qua điện thoại</span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Tích vào đây nếu bạn chưa chọn được chỗ ưng ý hoặc muốn nhờ nhân viên tổng đài chủ động tìm toa/giường còn trống và gọi lại báo giá cho bạn.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
