import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, X, Search } from 'lucide-react';
import { Station } from '../types';
import { POPULAR_STATIONS } from '../data/mockData';

interface StationAutocompleteProps {
  id?: string;
  label: string;
  value: string;
  onChange: (stationName: string) => void;
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabledStation?: string; // Tên ga đối diện (để highlight hoặc cảnh báo)
}

// Utility: Normalize Vietnamese string for intelligent search
export const removeVietnameseAccents = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

export const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Nhập tên ga (ví dụ: Sài Gòn, Hà Nội...)',
  hasError = false,
  errorMessage,
  disabledStation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [stations, setStations] = useState<Station[]>(POPULAR_STATIONS);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check admin role
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('railway_admin_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (e) {}
  }, []);

  // Fetch stations from backend on mount
  useEffect(() => {
    fetch('/api/stations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStations(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSyncFromSheet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncingSheet(true);
    try {
      const res = await fetch('/api/stations/sync-sheet', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.stations) {
        setStations(data.stations);
        alert(`✅ Đã cập nhật thành công ${data.count} ga mới nhất từ tab DsGa trên Google Sheet!`);
      } else {
        alert(data.error || 'Lỗi khi đồng bộ từ Google Sheet');
      }
    } catch (err) {
      alert('Không thể kết nối để đồng bộ danh sách ga từ Google Sheet.');
    } finally {
      setSyncingSheet(false);
    }
  };

  // Sync external value to internal query if external changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If query is empty, restore last valid value
        if (!query.trim()) {
          setQuery(value);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, value]);

  // Filter stations based on query
  const filteredStations = React.useMemo(() => {
    const rawQ = query.trim();
    if (!rawQ) return stations;

    const normalizedQ = removeVietnameseAccents(rawQ);

    return stations.filter((st) => {
      const normalizedName = removeVietnameseAccents(st.name);
      const normalizedCode = removeVietnameseAccents(st.code);
      const normalizedCity = removeVietnameseAccents(st.city || '');

      // Search by initials (e.g., 'sg' -> 'Sài Gòn', 'hn' -> 'Hà Nội')
      const initials = st.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toLowerCase();
      const normalizedInitials = removeVietnameseAccents(initials);

      return (
        normalizedName.includes(normalizedQ) ||
        normalizedCode.includes(normalizedQ) ||
        normalizedCity.includes(normalizedQ) ||
        normalizedInitials.includes(normalizedQ)
      );
    });
  }, [query, stations]);

  const handleSelectStation = (station: Station) => {
    setQuery(station.name);
    onChange(station.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    // If exactly matches one station, trigger onChange
    const matched = stations.find(
      (s) => removeVietnameseAccents(s.name) === removeVietnameseAccents(val)
    );
    if (matched) {
      onChange(matched.name);
    } else {
      onChange(val);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const getRegionBadge = (region: 'Bac' | 'Trung' | 'Nam') => {
    switch (region) {
      case 'Bac':
        return <span className="text-[10px] bg-red-50 text-red-700 font-semibold px-1.5 py-0.5 rounded border border-red-100">Miền Bắc</span>;
      case 'Trung':
        return <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.5 rounded border border-amber-100">Miền Trung</span>;
      case 'Nam':
        return <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded border border-blue-100">Miền Nam</span>;
    }
  };

  return (
    <div className="relative" ref={containerRef} id={id}>
      <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-700" />
          {label}
        </span>
        {query && query === disabledStation && (
          <span className="text-[10px] text-red-500 font-bold">Trùng với ga đối diện</span>
        )}
      </label>

      {/* Input container */}
      <div
        className={`relative flex items-center bg-white border rounded-lg sm:rounded-xl transition-all shadow-2xs ${
          hasError
            ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20'
            : isOpen
            ? 'border-blue-700 ring-2 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
        />

        {/* Clear button or dropdown toggle */}
        <div className="flex items-center pr-2 gap-1 shrink-0">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Xóa nhanh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error text below input */}
      {hasError && errorMessage && (
        <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1 animate-fade-in">
          <span>⚠️ {errorMessage}</span>
        </p>
      )}

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto animate-fade-in">
          {/* Header of dropdown */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold sticky top-0 z-10">
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-blue-700" />
              Gợi ý ga ({filteredStations.length})
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={handleSyncFromSheet}
                disabled={syncingSheet}
                className="text-[10px] text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Đồng bộ danh sách ga mới nhất từ tab DsGa trên Google Sheet"
              >
                <span>{syncingSheet ? 'Đang đồng bộ...' : '🔄 Cập nhật từ Sheet'}</span>
              </button>
            )}
          </div>

          {filteredStations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Không tìm thấy ga nào phù hợp với "<span className="font-bold text-slate-700">{query}</span>"
            </div>
          ) : (
            <div className="p-1 divide-y divide-slate-50">
              {filteredStations.map((st) => {
                const isSelected = removeVietnameseAccents(st.name) === removeVietnameseAccents(value);
                const isOpposite = disabledStation && removeVietnameseAccents(st.name) === removeVietnameseAccents(disabledStation);

                return (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => handleSelectStation(st)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : isOpposite
                        ? 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[10px] font-black ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {st.code}
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{st.name}</span>
                          {isOpposite && (
                            <span className="text-[9px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              Đang là ga đối diện
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getRegionBadge(st.region)}
                      {isSelected && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
