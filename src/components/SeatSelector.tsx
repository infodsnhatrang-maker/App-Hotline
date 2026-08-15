import React, { useState } from 'react';
import { SeatClass, TrainRoute, SEAT_CLASS_LABELS } from '../types';
import { Armchair, BedDouble, Bed, Check, Sparkles, UserCheck } from 'lucide-react';

interface SeatSelectorProps {
  selectedRoute: TrainRoute;
  selectedSeatClass: SeatClass;
  setSelectedSeatClass: (sc: SeatClass) => void;
  selectedSeatCodes: string[];
  setSelectedSeatCodes: React.Dispatch<React.SetStateAction<string[]>>;
  passengerCount: number;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  selectedRoute,
  selectedSeatClass,
  setSelectedSeatClass,
  selectedSeatCodes,
  setSelectedSeatCodes,
  passengerCount
}) => {
  const [selectedCoach, setSelectedCoach] = useState<number>(1);

  // Seat generation for selected class
  const getCoachSeats = () => {
    const seats = [];
    const isSleeper = selectedSeatClass !== 'soft_seat';
    const totalInCoach = isSleeper ? (selectedSeatClass === 'soft_sleeper' ? 28 : 42) : 56;

    for (let i = 1; i <= totalInCoach; i++) {
      const seatCode = `Toa ${selectedCoach} - ${isSleeper ? 'Giường' : 'Ghế'} ${i < 10 ? '0' + i : i}`;
      // Simulate some occupied seats
      const isBooked = i % 7 === 0 || i % 11 === 0;
      const isSelected = selectedSeatCodes.includes(seatCode);

      seats.push({
        id: seatCode,
        number: i,
        code: seatCode,
        isBooked,
        isSelected
      });
    }
    return seats;
  };

  const seats = getCoachSeats();

  const handleSeatClick = (seatCode: string, isBooked: boolean) => {
    if (isBooked) return;

    if (selectedSeatCodes.includes(seatCode)) {
      setSelectedSeatCodes(selectedSeatCodes.filter(s => s !== seatCode));
    } else {
      if (selectedSeatCodes.length >= passengerCount) {
        // If limit reached, replace last or notify
        const newArr = [...selectedSeatCodes.slice(1), seatCode];
        setSelectedSeatCodes(newArr);
      } else {
        setSelectedSeatCodes([...selectedSeatCodes, seatCode]);
      }
    }
  };

  const getSeatClassIcon = (sc: SeatClass) => {
    switch (sc) {
      case 'soft_seat': return <Armchair className="w-6 h-6 text-blue-600" />;
      case 'hard_sleeper': return <BedDouble className="w-6 h-6 text-amber-600" />;
      case 'soft_sleeper': return <Bed className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>1. Chọn Hạng Chỗ & Sơ Đồ Chỗ Tàu {selectedRoute.trainCode}</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
              Giờ đi: {selectedRoute.departureTime}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mỗi hành khách tương ứng chọn 1 chỗ trên toa tàu. Vui lòng chọn hạng ghế phù hợp với nhu cầu.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500">Số lượng chỗ cần chọn:</span>
          <span className="ml-2 font-bold text-red-600 text-base">
            {selectedSeatCodes.length} / {passengerCount}
          </span>
        </div>
      </div>

      {/* Seat Class Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['soft_seat', 'hard_sleeper', 'soft_sleeper'] as SeatClass[]).map((sc) => {
          const isSelected = selectedSeatClass === sc;
          const info = SEAT_CLASS_LABELS[sc];
          const price = selectedRoute.basePrices[sc];

          return (
            <div
              key={sc}
              onClick={() => {
                setSelectedSeatClass(sc);
                setSelectedSeatCodes([]); // reset selected when changing class
              }}
              className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-red-600 bg-red-50/40 shadow-md ring-1 ring-red-600/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl-lg">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-red-100' : 'bg-slate-100'}`}>
                    {getSeatClassIcon(sc)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{info.label}</h4>
                    <span className="text-xs font-semibold text-red-600">
                      {price.toLocaleString('vi-VN')} VNĐ / vé
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {info.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Còn trống: {selectedRoute.availableSeats[sc]} chỗ</span>
                {sc === 'soft_sleeper' && (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Tốt nhất
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Carriage / Coach Selection */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Chọn Toa Tàu:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {[1, 2, 3, 4, 5].map((coachNum) => (
                <button
                  key={coachNum}
                  onClick={() => setSelectedCoach(coachNum)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCoach === coachNum
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Toa {coachNum}
                </button>
              ))}
            </div>
          </div>

          {/* Seat Status Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-white border-2 border-slate-300"></div>
              <span className="text-slate-600">Còn trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-600"></div>
              <span className="text-slate-900 font-medium">Đang chọn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-300 border border-slate-400"></div>
              <span className="text-slate-400">Đã bán</span>
            </div>
          </div>
        </div>

        {/* Visual Seat Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-center text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
            --- Đầu Tàu --- Toa số {selectedCoach} ({SEAT_CLASS_LABELS[selectedSeatClass].label}) ---
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {seats.map((seat) => (
              <button
                key={seat.id}
                disabled={seat.isBooked}
                onClick={() => handleSeatClick(seat.code, seat.isBooked)}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all ${
                  seat.isBooked
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : seat.isSelected
                    ? 'bg-red-600 text-white shadow-md ring-2 ring-red-600/40 scale-105'
                    : 'bg-slate-50 hover:bg-red-50 text-slate-800 border border-slate-300 hover:border-red-400'
                }`}
                title={seat.code}
              >
                <span>{seat.number < 10 ? '0' + seat.number : seat.number}</span>
                <span className="text-[9px] font-normal opacity-80">
                  {selectedSeatClass === 'soft_seat' ? 'Ghế' : 'Giường'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Seats Summary */}
        {selectedSeatCodes.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-red-900 font-medium">
              <UserCheck className="w-4 h-4 text-red-600" />
              <span>Chỗ đã chọn:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeatCodes.map((sc) => (
                  <span key={sc} className="px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                    {sc}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelectedSeatCodes([])}
              className="text-red-700 underline font-semibold hover:text-red-900"
            >
              Chọn lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
