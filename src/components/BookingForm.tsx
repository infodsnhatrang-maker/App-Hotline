import React, { useState, useMemo, useEffect } from 'react';
import { TripType, SeatClass, PrimaryContact, PassengerDetail } from '../types';
import { POPULAR_STATIONS } from '../data/mockData';
import { Train, Calendar, MapPin, User, Phone, Mail, Users, Send, Armchair, BedDouble, Bed, PhoneCall, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { StationAutocomplete, removeVietnameseAccents } from './StationAutocomplete';
import { validateVietnamesePhone, validateEmail } from '../utils/validation';

interface BookingFormProps {
  onSubmitBooking: (bookingData: {
    tripType: TripType;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    seatClass: SeatClass;
    adultCount: number;
    childCount: number;
    contact: PrimaryContact;
    requestStaffSearch: boolean;
    totalAmount: number;
    passengers: PassengerDetail[];
  }) => void;
  isSubmitting: boolean;
  resetContactTrigger?: number;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmitBooking, isSubmitting, resetContactTrigger }) => {
  // 1. Loại vé (Một chiều, Khứ hồi)
  const [tripType, setTripType] = useState<TripType>('one_way');

  // 2. Ga đi, Ga đến
  const [origin, setOrigin] = useState('Hà Nội');
  const [destination, setDestination] = useState('Sài Gòn');

  // 3. Ngày đi tàu (và Ngày về nếu khứ hồi)
  const [departureDate, setDepartureDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });

  // 4. Loại chỗ
  const [seatClass, setSeatClass] = useState<SeatClass>('soft_sleeper');

  // Chi tiết từng loại chỗ
  const seatClassesInfo: Record<SeatClass, { label: string; desc: string }> = {
    soft_seat: {
      label: 'Ngồi mềm lạnh',
      desc: 'Ghế bọc da êm ái, điều hòa không khí'
    },
    hard_sleeper: {
      label: 'Giường nằm cứng (Khoang 6)',
      desc: 'Khoang 6 giường đệm tiêu chuẩn, điều hòa'
    },
    soft_sleeper: {
      label: 'Giường nằm mềm (Khoang 4)',
      desc: 'Khoang 4 giường đệm cao cấp, riêng tư'
    }
  };

  // 5. Số lượng vé (Người lớn, Trẻ em)
  const [adultCount, setAdultCount] = useState<number>(1);
  const [childCount, setChildCount] = useState<number>(0);

  // 6. Thông tin liên hệ hành khách
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [requestStaffSearch, setRequestStaffSearch] = useState(false);
  const [showCheckboxError, setShowCheckboxError] = useState(false);

  // Validation States for Phone & Email
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  // Reset Contact Information when request is successful and "Đặt Tiếp" is clicked
  useEffect(() => {
    if (resetContactTrigger && resetContactTrigger > 0) {
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setNameTouched(false);
      setPhoneTouched(false);
      setEmailTouched(false);
      setShowCheckboxError(false);

      // Focus on Departure station (Ga đi) input
      setTimeout(() => {
        const gaDiInput = document.querySelector('#origin-autocomplete input') as HTMLInputElement | null;
        if (gaDiInput) {
          gaDiInput.focus();
          gaDiInput.select();
        }
      }, 100);
    }
  }, [resetContactTrigger]);

  // Compute live validation results
  const phoneValidation = useMemo(() => validateVietnamesePhone(contactPhone), [contactPhone]);
  const emailValidation = useMemo(() => validateEmail(contactEmail), [contactEmail]);
  const nameValidation = useMemo(() => {
    const trimmed = contactName.trim();
    if (!trimmed) return { isValid: false, error: 'Vui lòng nhập họ tên người liên hệ' };
    if (trimmed.length < 2) return { isValid: false, error: 'Họ tên quá ngắn (tối thiểu 2 ký tự)' };
    return { isValid: true, error: '' };
  }, [contactName]);

  // Validation: Check if origin and destination are identical
  const isSameStation = Boolean(
    origin.trim() &&
    destination.trim() &&
    removeVietnameseAccents(origin) === removeVietnameseAccents(destination)
  );

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all contact fields as touched to trigger any error displays
    setNameTouched(true);
    setPhoneTouched(true);
    setEmailTouched(true);

    if (!requestStaffSearch) {
      setShowCheckboxError(true);
      alert('Lỗi: Bạn phải tích chọn "Gửi yêu cầu nhân viên hotline gọi lại tư vấn chỗ trống qua điện thoại" mới có thể thực hiện gửi yêu cầu đặt vé!');
      return;
    }

    if (!origin.trim() || !destination.trim()) {
      alert('Vui lòng chọn hoặc nhập đầy đủ Ga đi và Ga đến!');
      return;
    }

    if (isSameStation) {
      alert('Lỗi không hợp lệ: Ga đi và Ga đến không thể cùng tên nhau! Vui lòng chọn lại ga đến hoặc ga đi.');
      return;
    }

    if (!nameValidation.isValid) {
      alert('Họ tên người liên hệ không hợp lệ: ' + nameValidation.error);
      return;
    }

    // Strict validation check for Vietnamese Phone Number
    if (!phoneValidation.isValid) {
      alert('Lỗi số điện thoại: ' + phoneValidation.error + '\nVui lòng nhập đúng 10 số điện thoại di động tại Việt Nam (Ví dụ: 0988123456, 090..., 038...)');
      return;
    }

    // Strict validation check for Email
    if (!emailValidation.isValid) {
      alert('Lỗi email: ' + emailValidation.error + '\nVui lòng nhập đúng định dạng email (Ví dụ: nguyenvanan@gmail.com)');
      return;
    }

    // Build passenger details list
    const passengerList: PassengerDetail[] = [];

    for (let i = 1; i <= adultCount; i++) {
      passengerList.push({
        id: `p-adult-${i}`,
        name: i === 1 ? contactName.trim() : `Hành khách người lớn ${i}`,
        documentId: i === 1 ? '001092004812' : `CMND-${1000 + i}`,
        type: 'adult',
        price: 0
      });
    }

    for (let j = 1; j <= childCount; j++) {
      passengerList.push({
        id: `p-child-${j}`,
        name: `Trẻ em ${j}`,
        documentId: `KS-2020-${j}`,
        type: 'child',
        price: 0
      });
    }

    onSubmitBooking({
      tripType,
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round_trip' ? returnDate : undefined,
      seatClass,
      adultCount,
      childCount,
      contact: {
        name: contactName.trim(),
        phone: phoneValidation.cleaned,
        email: emailValidation.cleaned,
        documentId: '001092004812',
        note: requestStaffSearch ? 'Khách yêu cầu nhân viên bán vé gọi điện hỗ trợ tìm chỗ' : 'Đặt vé trực tuyến'
      },
      requestStaffSearch,
      totalAmount: 0,
      passengers: passengerList
    });
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/90 overflow-hidden max-w-4xl mx-auto">
      {/* Clean Compact Form Header */}
      <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3 bg-slate-50/70">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 rounded-xl shadow-sm text-white flex items-center justify-center shrink-0">
          <Train className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 uppercase truncate">
            NHẬP THÔNG TIN ĐẶT VÉ TÀU
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
            Điền thông tin hành trình & người liên hệ để nhận vé điện tử nhanh chóng.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
        {/* SECTION 1: LOẠI VÉ (MỘT CHIỀU / KHỨ HỒI) - COMPACT MOBILE */}
        <div>
          <label className="block text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            1. Loại Vé Đặt
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-sm">
            <label
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                tripType === 'one_way'
                  ? 'border-blue-700 bg-blue-50/70 text-blue-950 ring-1 ring-blue-700/30 shadow-xs'
                  : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'one_way'}
                onChange={() => setTripType('one_way')}
                className="w-3.5 h-3.5 text-blue-700 accent-blue-700"
              />
              <span className="whitespace-nowrap">Một chiều</span>
            </label>

            <label
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                tripType === 'round_trip'
                  ? 'border-blue-700 bg-blue-50/70 text-blue-950 ring-1 ring-blue-700/30 shadow-xs'
                  : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'round_trip'}
                onChange={() => setTripType('round_trip')}
                className="w-3.5 h-3.5 text-blue-700 accent-blue-700"
              />
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span>Khứ hồi</span>
                <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded">2 lượt</span>
              </span>
            </label>
          </div>
        </div>

        {/* SECTION 2 & 3: GA ĐI, GA ĐẾN (AUTOCOMPLETE & SEARCHABLE), NGÀY ĐI & NGÀY VỀ */}
        <div className="bg-slate-50/90 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 space-y-2">
          {/* Station Selection Grid: Autocomplete có gợi nhớ và tìm kiếm nhanh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {/* Ga Đi */}
            <StationAutocomplete
              id="origin-autocomplete"
              label="Ga đi *"
              value={origin}
              onChange={setOrigin}
              placeholder="Nhập tên ga đi (VD: Hà Nội, Sài Gòn...)"
              hasError={isSameStation}
              errorMessage={isSameStation ? 'Ga đi không được trùng Ga đến' : undefined}
              disabledStation={destination}
            />

            {/* Ga Đến */}
            <StationAutocomplete
              id="destination-autocomplete"
              label="Ga đến *"
              value={destination}
              onChange={setDestination}
              placeholder="Nhập tên ga đến (VD: Sài Gòn, Nha Trang...)"
              hasError={isSameStation}
              errorMessage={isSameStation ? 'Ga đến không được trùng Ga đi' : undefined}
              disabledStation={origin}
            />
          </div>

          {/* Same Station Alert Banner */}
          {isSameStation && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] sm:text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>Không hợp lệ:</strong> Ga đi và Ga đến trùng nhau (<span className="font-black text-red-900">{origin}</span>). Quý khách vui lòng chọn ga đến khác với ga đi.
              </span>
            </div>
          )}

          {/* Dates Grid */}
          <div className={`grid ${tripType === 'round_trip' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-1 border-t border-slate-200/60`}>
            {/* Ngày Đi Tàu */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-700" />
                Ngày đi tàu *
              </label>
              <input
                type="date"
                value={departureDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
              />
            </div>

            {/* Ngày Về (nếu khứ hồi) */}
            {tripType === 'round_trip' && (
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-700" />
                  Ngày về *
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: LOẠI CHỖ */}
        <div>
          <label className="block text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
            2. Chọn Loại Chỗ
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {(['soft_seat', 'hard_sleeper', 'soft_sleeper'] as SeatClass[]).map((sc) => {
              const item = seatClassesInfo[sc];
              const isSelected = seatClass === sc;

              return (
                <div
                  key={sc}
                  onClick={() => setSeatClass(sc)}
                  className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border-2 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/60 ring-1 ring-blue-700/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {sc === 'soft_seat' && <Armchair className="w-4 h-4" />}
                        {sc === 'hard_sleeper' && <BedDouble className="w-4 h-4" />}
                        {sc === 'soft_sleeper' && <Bed className="w-4 h-4" />}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{item.label}</h4>
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: SỐ LƯỢNG VÉ (BAO NHIÊU NGƯỜI LỚN, BAO NHIÊU TRẺ EM) */}
        <div className="bg-slate-50/90 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 space-y-2.5">
          <label className="block text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-700" />
            <span>3. Số Lượng Vé Hành Khách</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {/* Người lớn */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs sm:text-sm">Người lớn (Trên 10 tuổi)</p>
                <p className="text-[11px] text-slate-500">Đầy đủ quyền lợi chỗ ngồi / nằm</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-black text-sm text-slate-900 w-5 text-center">{adultCount}</span>
                <button
                  type="button"
                  onClick={() => setAdultCount(adultCount + 1)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Trẻ em */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1">
                  <span>Trẻ em (6 - 10 tuổi)</span>
                  <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded">Vé trẻ em</span>
                </p>
                <p className="text-[11px] text-slate-500">Giảm trừ theo độ tuổi quy định</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChildCount(Math.max(0, childCount - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-black text-sm text-slate-900 w-5 text-center">{childCount}</span>
                <button
                  type="button"
                  onClick={() => setChildCount(childCount + 1)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: THÔNG TIN LIÊN HỆ HÀNH KHÁCH */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>4. Thông Tin Liên Hệ Đặt Vé</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full w-fit">
              * Bắt buộc nhập đầy đủ để nhận vé điện tử
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
            {/* Họ và Tên */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-700" />
                  <span>Họ và Tên liên hệ <span className="text-red-500">*</span></span>
                </label>
                {nameTouched && nameValidation.isValid && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                  </span>
                )}
              </div>
              <input
                id="input-booking-contact-name"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn An"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  if (!nameTouched) setNameTouched(true);
                }}
                onBlur={() => setNameTouched(true)}
                className={`w-full rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all placeholder:text-slate-400 focus:outline-none ${
                  nameTouched && !nameValidation.isValid
                    ? 'bg-rose-50/40 border-2 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/30'
                    : nameTouched && nameValidation.isValid
                    ? 'bg-emerald-50/30 border-2 border-emerald-500/80 text-slate-900 focus:ring-2 focus:ring-emerald-400/30'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-700'
                }`}
              />
              {nameTouched && !nameValidation.isValid ? (
                <p className="text-[10.5px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{nameValidation.error}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Người nhận mã vé điện tử PNR</p>
              )}
            </div>

            {/* Số Điện Thoại */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-700" />
                  <span>Số điện thoại (VN) <span className="text-red-500">*</span></span>
                </label>
                {phoneTouched && phoneValidation.isValid && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Đúng SĐT Việt Nam
                  </span>
                )}
              </div>
              <input
                id="input-booking-contact-phone"
                type="tel"
                maxLength={15}
                placeholder="Ví dụ: 0988123456"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  if (!phoneTouched) setPhoneTouched(true);
                }}
                onBlur={() => setPhoneTouched(true)}
                className={`w-full rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all placeholder:text-slate-400 focus:outline-none ${
                  phoneTouched && !phoneValidation.isValid
                    ? 'bg-rose-50/40 border-2 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/30'
                    : phoneTouched && phoneValidation.isValid
                    ? 'bg-emerald-50/30 border-2 border-emerald-500/80 text-slate-900 focus:ring-2 focus:ring-emerald-400/30'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-700'
                }`}
              />
              {phoneTouched && !phoneValidation.isValid ? (
                <p className="text-[10.5px] font-bold text-rose-600 mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{phoneValidation.error}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  10 số di động VN (03x, 05x, 07x, 08x, 09x)
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-700" />
                  <span>Email nhận vé <span className="text-red-500">*</span></span>
                </label>
                {emailTouched && emailValidation.isValid && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Đúng định dạng email
                  </span>
                )}
              </div>
              <input
                id="input-booking-contact-email"
                type="email"
                placeholder="Ví dụ: nguyenvanan@gmail.com"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  if (!emailTouched) setEmailTouched(true);
                }}
                onBlur={() => setEmailTouched(true)}
                className={`w-full rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all placeholder:text-slate-400 focus:outline-none ${
                  emailTouched && !emailValidation.isValid
                    ? 'bg-rose-50/40 border-2 border-rose-500 text-rose-950 focus:ring-2 focus:ring-rose-400/30'
                    : emailTouched && emailValidation.isValid
                    ? 'bg-emerald-50/30 border-2 border-emerald-500/80 text-slate-900 focus:ring-2 focus:ring-emerald-400/30'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-700'
                }`}
              />
              {emailTouched && !emailValidation.isValid ? (
                <p className="text-[10.5px] font-bold text-rose-600 mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{emailValidation.error}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  Gửi vé điện tử PDF và hóa đơn về email này
                </p>
              )}
            </div>
          </div>

          {/* Hotline Option Checkbox */}
          <div className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all ${
            showCheckboxError
              ? 'bg-rose-50 border-2 border-rose-500 ring-2 ring-rose-400/20'
              : 'bg-amber-50/90 border border-amber-200 shadow-2xs'
          } mt-1`}>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requestStaffSearch}
                onChange={(e) => {
                  setRequestStaffSearch(e.target.checked);
                  if (e.target.checked) {
                    setShowCheckboxError(false);
                  }
                }}
                className={`mt-0.5 w-4 h-4 rounded cursor-pointer ${
                  showCheckboxError ? 'text-rose-600 accent-rose-600 focus:ring-rose-500' : 'text-amber-600 accent-amber-600 focus:ring-amber-500'
                }`}
              />
              <div>
                <span className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 ${
                  showCheckboxError ? 'text-rose-950' : 'text-amber-950'
                }`}>
                  <PhoneCall className={`w-3.5 h-3.5 shrink-0 ${showCheckboxError ? 'text-rose-700' : 'text-amber-700'}`} />
                  Gửi yêu cầu nhân viên hotline gọi lại tư vấn chỗ trống qua điện thoại
                </span>
                <p className={`text-[11px] sm:text-xs mt-0.5 leading-relaxed ${
                  showCheckboxError ? 'text-rose-900/80 font-semibold' : 'text-amber-900/80'
                }`}>
                  Nếu bạn cần tư vấn chọn tầng giường hoặc chưa có vé ngay, nhân viên tổng đài sẽ kiểm tra hệ thống và gọi điện trực tiếp báo giá.
                </p>
                {showCheckboxError && (
                  <p className="text-[11.5px] font-black text-rose-600 mt-2.5 flex items-center gap-1.5 animate-bounce">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>LƯU Ý: Bạn cần tích chọn ô này để gửi thông tin cho hotline hỗ trợ!</span>
                  </p>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 7 & 8: TỔNG HỢP VÀ NÚT GỬI (SUBMIT) */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-sky-700 text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 border border-blue-500/40">
          <div className="w-full sm:w-auto text-left">
            <span className="text-[11px] text-blue-100 uppercase font-extrabold tracking-wider block">THÔNG TIN HÀNH TRÌNH ĐẶT VÉ:</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 drop-shadow-sm flex items-center gap-2">
              <span>{origin}</span>
              <span className="text-sky-300">→</span>
              <span>{destination}</span>
            </div>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              {adultCount} người lớn, {childCount} trẻ em • {seatClassesInfo[seatClass].label} ({tripType === 'round_trip' ? 'Khứ hồi' : 'Một chiều'})
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isSameStation}
            className={`w-full sm:w-auto font-black py-4 px-9 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all text-sm sm:text-base shrink-0 ${
              isSameStation
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 active:scale-98 text-white shadow-blue-950/40 cursor-pointer disabled:opacity-50'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>GỬI YÊU CẦU ĐẶT VÉ</span>
          </button>
        </div>
      </form>
    </div>
  );
};
