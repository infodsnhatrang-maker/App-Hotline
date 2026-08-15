import React from 'react';
import { ArrowRightLeft, Calendar, MapPin, Train, RefreshCw } from 'lucide-react';
import { POPULAR_STATIONS } from '../data/mockData';
import { TripType } from '../types';

interface SearchFormProps {
  tripType: TripType;
  setTripType: (type: TripType) => void;
  origin: string;
  setOrigin: (origin: string) => void;
  destination: string;
  setDestination: (dest: string) => void;
  departureDate: string;
  setDepartureDate: (date: string) => void;
  returnDate: string;
  setReturnDate: (date: string) => void;
  onSearch: () => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  tripType,
  setTripType,
  origin,
  setOrigin,
  destination,
  setDestination,
  departureDate,
  setDepartureDate,
  returnDate,
  setReturnDate,
  onSearch
}) => {
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7 max-w-5xl mx-auto -mt-6 relative z-10">
      {/* Trip Type Selector */}
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-800">
          <input
            type="radio"
            name="tripType"
            checked={tripType === 'one_way'}
            onChange={() => setTripType('one_way')}
            className="w-4 h-4 text-red-600 focus:ring-red-500 accent-red-600"
          />
          <span>Một chiều</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-800">
          <input
            type="radio"
            name="tripType"
            checked={tripType === 'round_trip'}
            onChange={() => setTripType('round_trip')}
            className="w-4 h-4 text-red-600 focus:ring-red-500 accent-red-600"
          />
          <span className="flex items-center gap-1">
            Khứ hồi
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Ưu đãi</span>
          </span>
        </label>
      </div>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Origin Station */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            Ga đi (Nơi xuất phát)
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          >
            <optgroup label="Tuyến Miền Bắc / Hà Nội & Lân Cận">
              {POPULAR_STATIONS.filter(s => s.region === 'Bac').map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tuyến Miền Trung (Bắc Trung Bộ & Nam Trung Bộ)">
              {POPULAR_STATIONS.filter(s => s.region === 'Trung').map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tuyến Miền Nam & Đông Nam Bộ">
              {POPULAR_STATIONS.filter(s => s.region === 'Nam').map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center pb-1">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition-colors shadow-sm"
            title="Đổi chiều ga đi & ga đến"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Station */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            Ga đến (Điểm kết thúc)
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          >
            <optgroup label="Tuyến Miền Bắc / Hà Nội & Lân Cận">
              {POPULAR_STATIONS.filter(s => s.region === 'Bac').map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tuyến Miền Trung (Bắc Trung Bộ & Nam Trung Bộ)">
              {POPULAR_STATIONS.filter(s => s.region === 'Trung').map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tuyến Miền Nam & Đông Nam Bộ">
              {POPULAR_STATIONS.filter(s => s.region === 'Nam').map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Departure Date */}
        <div className={tripType === 'round_trip' ? 'md:col-span-2' : 'md:col-span-3'}>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-red-600" />
            Ngày đi tàu
          </label>
          <input
            type="date"
            value={departureDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        {/* Return Date (if round_trip) */}
        {tripType === 'round_trip' && (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-600" />
              Ngày về
            </label>
            <input
              type="date"
              value={returnDate}
              min={departureDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
        )}

        {/* Search Action Button */}
        <div className={tripType === 'round_trip' ? 'md:col-span-1' : 'md:col-span-2'}>
          <button
            onClick={onSearch}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Train className="w-4 h-4" />
            <span>Tìm vé</span>
          </button>
        </div>
      </div>

      {/* Popular Route Shortcuts */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500">Tuyến tàu phổ biến:</span>
        <button
          onClick={() => { setOrigin('Ga Hà Nội'); setDestination('Ga Đà Nẵng'); }}
          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 transition-colors"
        >
          Hà Nội → Đà Nẵng
        </button>
        <button
          onClick={() => { setOrigin('Ga Sài Gòn'); setDestination('Ga Nha Trang'); }}
          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 transition-colors"
        >
          Sài Gòn → Nha Trang
        </button>
        <button
          onClick={() => { setOrigin('Ga Hà Nội'); setDestination('Ga Sài Gòn'); }}
          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 transition-colors"
        >
          Hà Nội → Sài Gòn (Bắc Nam)
        </button>
        <button
          onClick={() => { setOrigin('Ga Sài Gòn'); setDestination('Ga Phan Thiết'); }}
          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 transition-colors"
        >
          Sài Gòn → Phan Thiết
        </button>
      </div>
    </div>
  );
};
