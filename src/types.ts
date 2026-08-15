export type SeatClass = 'soft_seat' | 'hard_sleeper' | 'soft_sleeper' | string;

export type TripType = 'one_way' | 'round_trip';

export type PassengerType = 'adult' | 'child' | 'senior' | 'student';

export interface SeatOption {
  id: string;
  code: string; // e.g. "Toa 1 - Ghế 12", "Toa 3 - Giường 04"
  coachNumber: number;
  number: number;
  isBooked: boolean;
  price: number;
}

export interface PassengerDetail {
  id?: string;
  name: string;
  documentId: string; // CMND/CCCD/Mã khai sinh
  type: PassengerType;
  seatCode?: string;
  coach?: string;
  seatNumber?: string;
  price: number;
}

export interface PrimaryContact {
  name: string;
  phone: string;
  email: string;
  documentId?: string;
  note?: string;
}

export interface TrainRoute {
  id: string;
  trainCode: string; // e.g. "SE1", "SE3", "SE7", "TN1"
  origin: string;
  destination: string;
  departureTime: string; // e.g. "06:00"
  arrivalTime: string;   // e.g. "11:30"
  duration: string;      // e.g. "5g 30p"
  basePrices: Record<SeatClass, number>;
  availableSeats: Record<SeatClass, number>;
}

export type BookingStatus = 
  | 'pending_payment'        // Khách mới đặt, chờ thanh toán
  | 'paid'                   // Đã thanh toán, vé điện tử sẵn sàng
  | 'pending_staff_search'   // Khách yêu cầu tìm vé / Chờ nhân viên gọi lại
  | 'notified_has_seat'      // Nhân viên đã báo có vé, kết thúc tìm kiếm
  | 'searching_continued'    // Nhân viên đã xử lý nhưng chưa có vé, tiếp tục tìm
  | 'completed'              // Đã hoàn thành chuyến đi
  | 'cancelled';             // Đã hủy

export type PaymentMethod = 'vietqr' | 'vnpay' | 'momo' | 'card';

export interface PaymentDetails {
  method: PaymentMethod;
  status: 'pending' | 'success';
  transactionId?: string;
  paidAt?: string;
}

export interface StaffProcessingLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: 'notified_has_seat' | 'searching_continued' | 'completed' | 'cancelled' | 'note_added';
  note: string;
  previousStatus?: BookingStatus;
  newStatus?: BookingStatus;
}

export interface Booking {
  id: string;
  pnr: string; // Mã vé / Mã đặt chỗ e.g. "DS-928134"
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  trainCode: string;
  returnTrainCode?: string;
  seatClass: SeatClass;
  selectedSeats?: string[];
  passengers: PassengerDetail[];
  contact: PrimaryContact;
  totalAmount: number;
  status: BookingStatus;
  payment?: PaymentDetails;
  createdAt: string;
  emailSent?: boolean;
  emailSentAt?: string;
  reminderEnabled?: boolean;
  reminderTimes?: string[]; // e.g. ["24h", "3h"]
  assignedStaff?: string;
  requestStaffSearch?: boolean;
  processingLogs: StaffProcessingLog[];
}

export interface Station {
  code: string;
  name: string;
  city: string;
  region: 'Bac' | 'Trung' | 'Nam';
}

export const SEAT_CLASS_LABELS: Record<SeatClass, { label: string; desc: string; icon: string }> = {
  soft_seat: {
    label: 'Ngồi mềm lạnh',
    desc: 'Ghế bọc da êm ái, điều hòa không khí toàn toa, màn hình giải trí, ổ cắm sạc',
    icon: 'Armchair'
  },
  hard_sleeper: {
    label: 'Giường nằm cứng (Khoang 6)',
    desc: 'Khoang 6 giường đệm tiêu chuẩn, điều hòa, không gian tiết kiệm & thoáng mát',
    icon: 'BedDouble'
  },
  soft_sleeper: {
    label: 'Giường nằm mềm (Khoang 4)',
    desc: 'Khoang 4 giường đệm cao cấp, không gian riêng tư, có cửa khóa, chăn gối sang trọng',
    icon: 'Bed'
  }
};

export const PASSENGER_TYPE_DISCOUNTS: Record<PassengerType, { label: string; discountRate: number }> = {
  adult: { label: 'Người lớn (Trên 12 tuổi)', discountRate: 0 },
  child: { label: 'Trẻ em (6 - 10 tuổi) - Giảm 25%', discountRate: 0.25 },
  senior: { label: 'Người cao tuổi (Từ 60 tuổi) - Giảm 15%', discountRate: 0.15 },
  student: { label: 'Sinh viên - Giảm 10%', discountRate: 0.10 }
};

export type UserRole = 'admin' | 'staff';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  email?: string;
  branch?: string;
}
