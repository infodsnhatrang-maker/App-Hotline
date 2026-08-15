import { Station, TrainRoute, Booking } from '../types';

export const POPULAR_STATIONS: Station[] = [
  // Tuyến Bắc - Nam đầy đủ các ga từ Bắc vào Nam (chỉ hiển thị Tỉnh/Thành phố cập nhật mới nhất)
  { code: 'HN', name: 'Hà Nội', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'GB', name: 'Giáp Bát', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'VD', name: 'Văn Điển', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'TT', name: 'Thường Tín', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'CT', name: 'Chợ Tía', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'DX', name: 'Đỗ Xá', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'PX', name: 'Phú Xuyên', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'DV', name: 'Đồng Văn', city: 'Tỉnh Hà Nam', region: 'Bac' },
  { code: 'PL', name: 'Phủ Lý', city: 'Tỉnh Hà Nam', region: 'Bac' },
  { code: 'BL', name: 'Bình Lục', city: 'Tỉnh Hà Nam', region: 'Bac' },
  { code: 'CH', name: 'Cầu Họ', city: 'Tỉnh Nam Định', region: 'Bac' },
  { code: 'ND', name: 'Nam Định', city: 'Tỉnh Nam Định', region: 'Bac' },
  { code: 'TX', name: 'Trịnh Xuyên', city: 'Tỉnh Nam Định', region: 'Bac' },
  { code: 'NG', name: 'Núi Gôi', city: 'Tỉnh Nam Định', region: 'Bac' },
  { code: 'CD', name: 'Cát Đằng', city: 'Tỉnh Nam Định', region: 'Bac' },
  { code: 'NB', name: 'Ninh Bình', city: 'Tỉnh Ninh Bình', region: 'Bac' },
  { code: 'CY', name: 'Cầu Yên', city: 'Tỉnh Ninh Bình', region: 'Bac' },
  { code: 'G', name: 'Ghềnh', city: 'Tỉnh Ninh Bình', region: 'Bac' },
  { code: 'DG', name: 'Đồng Giao', city: 'Tỉnh Ninh Bình', region: 'Bac' },
  { code: 'BS', name: 'Bỉm Sơn', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'DL', name: 'Đò Lèn', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'NT', name: 'Nghĩa Trang', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'HR', name: 'Hàm Rồng', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'TH', name: 'Thanh Hóa', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'YT1', name: 'Yên Thái', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'MK', name: 'Minh Khởi', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'NN', name: 'Núi Nưa', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'AT', name: 'Ân Thi', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'TL', name: 'Thị Long', city: 'Tỉnh Thanh Hóa', region: 'Trung' },
  { code: 'NM', name: 'Nga My', city: 'Tỉnh Nghệ An', region: 'Trung' },
  { code: 'VH', name: 'Văn Háp', city: 'Tỉnh Nghệ An', region: 'Trung' },
  { code: 'CS', name: 'Chợ Sy', city: 'Tỉnh Nghệ An', region: 'Trung' },
  { code: 'ML', name: 'Mỹ Lý', city: 'Tỉnh Nghệ An', region: 'Trung' },
  { code: 'QH', name: 'Quán Hành', city: 'Tỉnh Nghệ An', region: 'Trung' },
  { code: 'VI', name: 'Vinh', city: 'Tỉnh Nghệ An', region: 'Trung' },
  { code: 'YT', name: 'Yên Trung', city: 'Tỉnh Hà Tĩnh', region: 'Trung' },
  { code: 'HD', name: 'Hoà Duyệt', city: 'Tỉnh Hà Tĩnh', region: 'Trung' },
  { code: 'CL', name: 'Chu Lễ', city: 'Tỉnh Hà Tĩnh', region: 'Trung' },
  { code: 'HPB', name: 'Hương Phố', city: 'Tỉnh Hà Tĩnh', region: 'Trung' },
  { code: 'PTR', name: 'Phúc Trạch', city: 'Tỉnh Hà Tĩnh', region: 'Trung' },
  { code: 'LKH2', name: 'La Khê', city: 'Tỉnh Hà Tĩnh', region: 'Trung' },
  { code: 'TA', name: 'Tân Ấp', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'DLE', name: 'Đồng Lê', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'KLU', name: 'Kim Lũ', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'LSO', name: 'Lê Sơn', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'NLM', name: 'Ngọc Lâm', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'LSO2', name: 'Lạc Sơn', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'MC', name: 'Minh Cầm', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'TL2', name: 'Thọ Lộc', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'DH', name: 'Đồng Hới', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'LSO3', name: 'Lệ Sơn', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'LDA', name: 'Long Đại', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'MDC', name: 'Mỹ Đức', city: 'Tỉnh Quảng Bình', region: 'Trung' },
  { code: 'PHO', name: 'Phú Hồ', city: 'Tỉnh Quảng Trị', region: 'Trung' },
  { code: 'SLU', name: 'Sa Lung', city: 'Tỉnh Quảng Trị', region: 'Trung' },
  { code: 'TAI', name: 'Tiên An', city: 'Tỉnh Quảng Trị', region: 'Trung' },
  { code: 'DHA', name: 'Đông Hà', city: 'Tỉnh Quảng Trị', region: 'Trung' },
  { code: 'QT', name: 'Quảng Trị', city: 'Tỉnh Quảng Trị', region: 'Trung' },
  { code: 'DSAN', name: 'Di San', city: 'Tỉnh Quảng Trị', region: 'Trung' },
  { code: 'PCA', name: 'Phủ Cát', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'VX', name: 'Văn Xá', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'HUE', name: 'Huế', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'HTU', name: 'Hương Thủy', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'TRU', name: 'Truồi', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'CHAI', name: 'Cầu Hai', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'PLOC', name: 'Phụ Lộc', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'LCO', name: 'Lăng Cô', city: 'Thành phố Huế', region: 'Trung' },
  { code: 'DN', name: 'Đà Nẵng', city: 'Thành phố Đà Nẵng', region: 'Trung' },
  { code: 'TK', name: 'Trà Kiệu', city: 'Tỉnh Quảng Nam', region: 'Trung' },
  { code: 'PCG', name: 'Phú Cang', city: 'Tỉnh Quảng Nam', region: 'Trung' },
  { code: 'TKY', name: 'Tam Kỳ', city: 'Tỉnh Quảng Nam', region: 'Trung' },
  { code: 'NTH', name: 'Núi Thành', city: 'Tỉnh Quảng Nam', region: 'Trung' },
  { code: 'QN', name: 'Quảng Ngãi', city: 'Tỉnh Quảng Ngãi', region: 'Trung' },
  { code: 'MD', name: 'Mộ Đức', city: 'Tỉnh Quảng Ngãi', region: 'Trung' },
  { code: 'DP', name: 'Đức Phổ', city: 'Tỉnh Quảng Ngãi', region: 'Trung' },
  { code: 'TTR', name: 'Thạch Trụ', city: 'Tỉnh Quảng Ngãi', region: 'Trung' },
  { code: 'SH', name: 'Sa Huỳnh', city: 'Tỉnh Quảng Ngãi', region: 'Trung' },
  { code: 'TQ', name: 'Tam Quan', city: 'Tỉnh Gia Lai', region: 'Trung' },
  { code: 'BSN', name: 'Bồng Sơn', city: 'Tỉnh Gia Lai', region: 'Trung' },
  { code: 'PC2', name: 'Phù Cát', city: 'Tỉnh Gia Lai', region: 'Trung' },
  { code: 'DT', name: 'Diêu Trì', city: 'Tỉnh Gia Lai', region: 'Trung' },
  { code: 'QNH', name: 'Quy Nhơn', city: 'Tỉnh Gia Lai', region: 'Trung' },
  { code: 'TUH', name: 'Tuy Hòa', city: 'Tỉnh Đắk Lắk', region: 'Trung' },
  { code: 'DLN', name: 'Đại Lãnh', city: 'Tỉnh Khánh Hòa', region: 'Trung' },
  { code: 'GIA', name: 'Giã', city: 'Tỉnh Khánh Hòa', region: 'Trung' },
  { code: 'NHO', name: 'Ninh Hòa', city: 'Tỉnh Khánh Hòa', region: 'Trung' },
  { code: 'NTR', name: 'Nha Trang', city: 'Tỉnh Khánh Hòa', region: 'Trung' },
  { code: 'TC', name: 'Tháp Chàm', city: 'Tỉnh Ninh Thuận', region: 'Trung' },
  { code: 'SM', name: 'Sông Mao', city: 'Tỉnh Bình Thuận', region: 'Nam' },
  { code: 'BT', name: 'Bình Thuận', city: 'Tỉnh Bình Thuận', region: 'Nam' },
  { code: 'PT', name: 'Phan Thiết', city: 'Tỉnh Bình Thuận', region: 'Nam' },
  { code: 'LK', name: 'Long Khánh', city: 'Tỉnh Đồng Nai', region: 'Nam' },
  { code: 'BH', name: 'Biên Hòa', city: 'Tỉnh Đồng Nai', region: 'Nam' },
  { code: 'DA', name: 'Dĩ An', city: 'Tỉnh Bình Dương', region: 'Nam' },
  { code: 'SG', name: 'Sài Gòn', city: 'TP. Hồ Chí Minh', region: 'Nam' },
  { code: 'GL', name: 'Gia Lâm', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'LB', name: 'Long Biên', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'YV', name: 'Yên Viên', city: 'TP. Hà Nội', region: 'Bac' },
  { code: 'HP', name: 'Hải Phòng', city: 'TP. Hải Phòng', region: 'Bac' },
  { code: 'LC', name: 'Lào Cai', city: 'Tỉnh Lào Cai', region: 'Bac' },
  { code: 'DD', name: 'Đồng Đăng', city: 'Tỉnh Lạng Sơn', region: 'Bac' }
];

export const MOCK_TRAIN_ROUTES: TrainRoute[] = [
  {
    id: 'tr-01',
    trainCode: 'SE3',
    origin: 'Ga Hà Nội',
    destination: 'Ga Sài Gòn',
    departureTime: '19:25',
    arrivalTime: '05:50 (+1 ngày)',
    duration: '34g 25p',
    basePrices: {
      soft_seat: 480000,
      hard_sleeper: 720000,
      soft_sleeper: 980000
    },
    availableSeats: {
      soft_seat: 42,
      hard_sleeper: 18,
      soft_sleeper: 8
    }
  },
  {
    id: 'tr-02',
    trainCode: 'SE1',
    origin: 'Ga Hà Nội',
    destination: 'Ga Sài Gòn',
    departureTime: '22:15',
    arrivalTime: '08:30 (+1 ngày)',
    duration: '34g 15p',
    basePrices: {
      soft_seat: 520000,
      hard_sleeper: 760000,
      soft_sleeper: 1050000
    },
    availableSeats: {
      soft_seat: 30,
      hard_sleeper: 12,
      soft_sleeper: 4
    }
  },
  {
    id: 'tr-03',
    trainCode: 'SE7',
    origin: 'Ga Hà Nội',
    destination: 'Ga Đà Nẵng',
    departureTime: '06:00',
    arrivalTime: '21:40',
    duration: '15g 40p',
    basePrices: {
      soft_seat: 390000,
      hard_sleeper: 580000,
      soft_sleeper: 790000
    },
    availableSeats: {
      soft_seat: 50,
      hard_sleeper: 24,
      soft_sleeper: 14
    }
  },
  {
    id: 'tr-04',
    trainCode: 'SNT2',
    origin: 'Ga Sài Gòn',
    destination: 'Ga Nha Trang',
    departureTime: '20:30',
    arrivalTime: '05:30 (+1 ngày)',
    duration: '9g 00p',
    basePrices: {
      soft_seat: 320000,
      hard_sleeper: 490000,
      soft_sleeper: 650000
    },
    availableSeats: {
      soft_seat: 38,
      hard_sleeper: 20,
      soft_sleeper: 10
    }
  },
  {
    id: 'tr-05',
    trainCode: 'SPT2',
    origin: 'Ga Sài Gòn',
    destination: 'Ga Phan Thiết',
    departureTime: '06:45',
    arrivalTime: '10:30',
    duration: '3g 45p',
    basePrices: {
      soft_seat: 210000,
      hard_sleeper: 310000,
      soft_sleeper: 420000
    },
    availableSeats: {
      soft_seat: 60,
      hard_sleeper: 30,
      soft_sleeper: 16
    }
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-387841',
    pnr: 'DS-387841',
    tripType: 'one_way',
    origin: 'Ga Sài Gòn',
    destination: 'Ga Nha Trang',
    departureDate: '2026-08-16',
    trainCode: 'SE4',
    seatClass: 'Giường nằm mềm (Khoang 4)',
    selectedSeats: ['Toa 4 - Giường 1', 'Toa 4 - Giường 2'],
    passengers: [
      { name: 'Nguyễn bé ba', type: 'adult', documentId: '001092004812', coach: 'Toa 4', seatNumber: 'Giường 1 (Tầng 1)', price: 850000 },
      { name: 'Hành khách người lớn 2', type: 'adult', documentId: 'CMND-1002', coach: 'Toa 4', seatNumber: 'Giường 2 (Tầng 2)', price: 850000 }
    ],
    contact: {
      name: 'Nguyễn bé ba',
      phone: '0905421312',
      email: 'phuong.it.hcm.vn@gmail.com',
      note: 'Khách yêu cầu nhân viên bán vé gọi điện hỗ trợ tìm chỗ'
    },
    totalAmount: 1700000,
    status: 'pending_staff_search',
    createdAt: '2026-08-15 01:17:50',
    emailSent: false,
    reminderEnabled: true,
    reminderTimes: ['24h', '3h'],
    processingLogs: [
      {
        id: 'log-1',
        timestamp: '2026-08-15 01:17:50',
        staffName: 'Hệ thống tự động',
        action: 'searching_continued',
        note: 'Khách hàng gửi yêu cầu nhân viên gọi lại hỗ trợ tìm vé qua điện thoại.'
      },
      {
        id: 'log-2',
        timestamp: '2026-08-15 01:23:00',
        staffName: 'Ngô Thị Duy An',
        action: 'searching_continued',
        note: 'khách hàng chờ tiếp'
      },
      {
        id: 'log-3',
        timestamp: '2026-08-15 01:31:05',
        staffName: 'Ngô Thị Duy An',
        action: 'searching_continued',
        note: 'đã gọi khách hàng nhưng chưa co vé khách hàng tiếp tục chờ'
      }
    ]
  },
  {
    id: 'bk-387842',
    pnr: 'DS-387842',
    tripType: 'one_way',
    origin: 'Ga Sài Gòn',
    destination: 'Ga Nha Trang',
    departureDate: '2026-08-16',
    trainCode: 'SE2',
    seatClass: 'Giường nằm cứng (Khoang 6)',
    selectedSeats: ['Toa 3 - Giường 4'],
    passengers: [
      { name: 'Lan Phương', type: 'adult', documentId: '001092009999', coach: 'Toa 3', seatNumber: 'Giường 4 (Tầng 2)', price: 650000 }
    ],
    contact: {
      name: 'Lan Phương',
      phone: '0905999888',
      email: 'lanphuong@gmail.com',
      note: 'Khách yêu cầu nhân viên bán vé gọi điện hỗ trợ tìm chỗ'
    },
    totalAmount: 650000,
    status: 'pending_staff_search',
    createdAt: '2026-08-15 01:25:00',
    emailSent: false,
    reminderEnabled: true,
    reminderTimes: ['24h', '3h'],
    processingLogs: [
      {
        id: 'log-201',
        timestamp: '2026-08-15 01:25:00',
        staffName: 'Hệ thống tự động',
        action: 'searching_continued',
        note: 'Khách hàng gửi yêu cầu nhân viên gọi lại hỗ trợ tìm vé qua điện thoại.'
      }
    ]
  }
];
