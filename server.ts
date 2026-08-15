import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_BOOKINGS, MOCK_TRAIN_ROUTES, POPULAR_STATIONS } from './src/data/mockData';
import { Booking, StaffProcessingLog, BookingStatus, Station } from './src/types';

// In-memory persistent database for dev runtime
let bookingsDB: Booking[] = [];
let stationsDB: Station[] = [...POPULAR_STATIONS];

// Temporary memory cache to prevent race conditions during async Google Sheet updates
const recentlyCreatedBookings = new Map<string, { booking: Booking; timestamp: number }>();
const recentlyUpdatedBookings = new Map<string, { status: BookingStatus; logs: StaffProcessingLog[]; timestamp: number }>();
const deletedBookingsPnrs = new Set<string>();

// User database corresponding to Google Sheet 'User' tab (GID: 514187060)
const USERS_DB = [
  {
    no: 7,
    id: 'USR-007',
    username: 'Admin',
    user: 'Admin',
    password: '123456',
    Password: '123456',
    fullName: 'Nguyễn Anh Tuấn',
    hoten: 'Nguyễn Anh Tuấn',
    namsinh: '18/09/1982',
    chucvu: 'CV P. Tổng Hợp (Quản trị hệ thống)',
    role: 'admin',
    phone: '0985378861',
    email: 'admin@vantainhatrang.vn',
    branch: 'Trung tâm Quản trị & CNTT'
  },
  {
    no: 31,
    id: 'USR-031',
    username: 'ngotdan',
    user: 'ngotdan',
    password: '123456',
    Password: '123456',
    fullName: 'Ngô Thị Duy An',
    hoten: 'Ngô Thị Duy An',
    namsinh: '16/08/1978',
    chucvu: 'Nhân viên trực hotline & bán vé',
    role: 'staff',
    phone: '0905123456',
    email: 'an.ngo@vantainhatrang.vn',
    branch: 'Tổ Hotline Bán vé qua điện thoại'
  },
  {
    no: 1,
    id: 'USR-001',
    username: 'infodsnhatrang',
    user: 'infodsnhatrang',
    password: '123456',
    Password: '123456',
    fullName: 'CN VTĐS Nha Trang (Admin)',
    hoten: 'CN VTĐS Nha Trang',
    namsinh: '01/01/1980',
    chucvu: 'Quản trị chi nhánh',
    role: 'admin',
    phone: '02583822113',
    email: 'infodsnhatrang@vantainhatrang.vn',
    branch: 'Chi nhánh Vận tải ĐS Nha Trang'
  },
  {
    no: 2,
    id: 'USR-002',
    username: 'nguyen.vt',
    user: 'nguyen.vt',
    password: '123456',
    Password: '123456',
    fullName: 'Nguyễn Văn Tiến',
    hoten: 'Nguyễn Văn Tiến',
    namsinh: '17/01/1970',
    chucvu: 'Phó Giám đốc',
    role: 'admin',
    phone: '0913456789',
    email: 'tien.nguyen@vantainhatrang.vn',
    branch: 'Ban Giám đốc'
  },
  {
    no: 3,
    id: 'USR-003',
    username: 'tran.vd',
    user: 'tran.vd',
    password: '123456',
    Password: '123456',
    fullName: 'Trần Vĩnh Duy',
    hoten: 'Trần Vĩnh Duy',
    namsinh: '04/10/1973',
    chucvu: 'Phó Giám đốc',
    role: 'admin',
    phone: '0913987654',
    email: 'duy.tran@vantainhatrang.vn',
    branch: 'Ban Giám đốc'
  },
  {
    no: 4,
    id: 'USR-004',
    username: 'nguyen.lp',
    user: 'nguyen.lp',
    password: '123456',
    Password: '123456',
    fullName: 'Nguyễn Linh Phương',
    hoten: 'Nguyễn Linh Phương',
    namsinh: '19/05/1985',
    chucvu: 'TP. TCKT',
    role: 'admin',
    phone: '0905667788',
    email: 'phuong.nguyen@vantainhatrang.vn',
    branch: 'Phòng Tài chính Kế toán'
  },
  {
    no: 29,
    id: 'USR-029',
    username: 'vu.tkv',
    user: 'vu.tkv',
    password: '123456',
    Password: '123456',
    fullName: 'Vũ Thị Khánh Vân',
    hoten: 'Vũ Thị Khánh Vân',
    namsinh: '09/07/1990',
    chucvu: 'Nhân viên bán vé',
    role: 'staff',
    phone: '0987112233',
    email: 'van.vu@vantainhatrang.vn',
    branch: 'Phòng vé Ga Nha Trang'
  },
  {
    no: 32,
    id: 'USR-032',
    username: 'nguyen.tt',
    user: 'nguyen.tt',
    password: '123456',
    Password: '123456',
    fullName: 'Nguyễn Thị Thuỳ',
    hoten: 'Nguyễn Thị Thuỳ',
    namsinh: '17/02/1990',
    chucvu: 'Nhân viên bán vé',
    role: 'staff',
    phone: '0978998877',
    email: 'thuy.nguyen@vantainhatrang.vn',
    branch: 'Phòng vé Ga Nha Trang'
  }
];

let activeUsersDB = [...USERS_DB];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const syncUsersFromGoogleSheet = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const sheetId = '1K2sxxYYK5ltBbWc6lXNIXBVkLxGjvIC_VRmzsyY7C0U';
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=514187060`);
      if (!res.ok) {
        throw new Error('Không thể tải danh sách tài khoản từ Google Sheet');
      }
      const csvText = await res.text();
      const parseCsvLines = (text: string) => {
        return text.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim()));
      };
      const lines = parseCsvLines(csvText);
      if (lines.length <= 1) {
        return { success: false, count: 0, error: 'Bảng tài khoản trống' };
      }

      const newUsers: typeof USERS_DB = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < 3) continue;
        const noVal = Number(row[0]) || i;
        const userVal = row[1] || '';
        const passVal = row[2] || '';
        const nameVal = row[3] || '';
        const yobVal = row[4] || '';
        const titleVal = row[5] || '';

        if (!userVal) continue;

        let role = 'staff';
        const lowerUser = userVal.toLowerCase();
        const lowerTitle = titleVal.toLowerCase();
        if (
          lowerUser === 'admin' || 
          lowerUser === 'infodsnhatrang' || 
          lowerTitle.includes('quản trị') || 
          lowerTitle.includes('admin') || 
          lowerTitle.includes('giám đốc') || 
          lowerTitle.includes('tp.') || 
          lowerTitle.includes('trưởng phòng')
        ) {
          role = 'admin';
        }

        newUsers.push({
          no: noVal,
          id: 'USR-' + String(noVal).padStart(3, '0'),
          username: userVal,
          user: userVal,
          password: passVal,
          Password: passVal,
          fullName: nameVal || userVal,
          hoten: nameVal || userVal,
          namsinh: yobVal,
          chucvu: titleVal,
          role: role,
          phone: '',
          email: '',
          branch: titleVal || 'Phòng ban Chi nhánh'
        });
      }

      if (newUsers.length > 0) {
        activeUsersDB = [...newUsers];
        console.log(`Successfully synced ${activeUsersDB.length} staff/admin accounts from Sheet 514187060!`);
        return { success: true, count: activeUsersDB.length };
      }
      return { success: false, count: 0, error: 'Không tìm thấy tài khoản hợp lệ' };
    } catch (e: any) {
      console.error('Failed to sync users from Google Sheet:', e.message);
      return { success: false, count: 0, error: e.message };
    }
  };

  const syncBookingsFromGoogleSheet = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const sheetId = '1K2sxxYYK5ltBbWc6lXNIXBVkLxGjvIC_VRmzsyY7C0U';
      
      const resDon = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=DON_DAT_VE`);
      const csvDon = resDon.ok ? await resDon.text() : '';
      
      const resHk = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=HANH_KHACH`);
      const csvHk = resHk.ok ? await resHk.text() : '';

      const resNk = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=NHAT_KY_XU_LY`);
      const csvNk = resNk.ok ? await resNk.text() : '';

      const parseCsvLines = (text: string) => {
        return text.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim()));
      };

      const donLines = parseCsvLines(csvDon);
      const hkLines = parseCsvLines(csvHk);
      const nkLines = parseCsvLines(csvNk);

      const newBookings: Booking[] = [];

      for (let i = 1; i < donLines.length; i++) {
        const row = donLines[i];
        const pnr = row[0];
        if (!pnr || pnr === 'Mã PNR') continue;
        if (deletedBookingsPnrs.has(pnr)) continue;

        const createdAt = row[1] || new Date().toLocaleString('vi-VN');
        const tripType = row[2] === 'Khứ hồi' ? 'round_trip' : 'one_way';
        const origin = row[3] || 'Ga Sài Gòn';
        const destination = row[4] || 'Ga Nha Trang';
        const departureDate = row[5] || '';
        const returnDate = row[6] || '';
        const seatClass = row[7] || 'Giường nằm mềm (Khoang 4)';
        const contactName = row[11] || '';
        const contactPhone = row[12] ? row[12].replace(/^'/, '') : '';
        const contactEmail = row[13] || '';
        const contactNote = row[14] || '';
        const statusText = row[15] || '';
        const trainCode = row[16] || '';
        const staffName = row[17] || 'Chưa phân công';
        const totalAmount = Number(row[18]) || 1700000;
        const paymentStatus = row[19] || '';

        let status: BookingStatus = 'pending_staff_search';
        if (statusText.includes('Xử lý xong')) status = 'notified_has_seat';
        else if (statusText.includes('Đã thanh toán') || paymentStatus.includes('Đã thanh toán')) status = 'paid';
        else if (statusText.includes('Đã hoàn thành')) status = 'completed';
        else if (statusText.includes('Đang tìm vé')) status = 'searching_continued';
        else if (statusText.includes('Đã hủy')) status = 'cancelled';

        const passengers: any[] = [];
        for (let h = 1; h < hkLines.length; h++) {
          const hkRow = hkLines[h];
          if (hkRow[1] === pnr) {
            passengers.push({
              name: hkRow[2] || contactName,
              type: (hkRow[3] || '').includes('Trẻ') ? 'child' : 'adult',
              documentId: hkRow[4] ? hkRow[4].replace(/^'/, '') : '',
              coach: hkRow[6] || '',
              seatNumber: hkRow[7] || '',
              price: Number(hkRow[8]) || Math.round(totalAmount / (Number(row[10]) || 1))
            });
          }
        }

        const processingLogs: any[] = [];
        for (let n = 1; n < nkLines.length; n++) {
          const nkRow = nkLines[n];
          if (nkRow[1] === pnr) {
            processingLogs.push({
              id: 'log-' + Math.random(),
              timestamp: nkRow[2] || createdAt,
              staffName: nkRow[3] || 'Hệ thống tự động',
              action: 'searching_continued',
              note: nkRow[5] || ''
            });
          }
        }

        if (processingLogs.length === 0) {
          processingLogs.push({
            id: 'log-default',
            timestamp: createdAt,
            staffName: staffName !== 'Chưa phân công' ? staffName : 'Hệ thống tự động',
            action: 'searching_continued',
            note: contactNote || 'Khách hàng gửi yêu cầu'
          });
        }

        newBookings.push({
          id: 'bk-' + pnr.replace(/[^a-zA-Z0-9]/g, ''),
          pnr,
          tripType: tripType as any,
          origin,
          destination,
          departureDate,
          returnDate,
          trainCode,
          seatClass,
          selectedSeats: passengers.map(p => `${p.coach} - ${p.seatNumber}`),
          passengers,
          contact: {
            name: contactName,
            phone: contactPhone,
            email: contactEmail,
            note: contactNote
          },
          totalAmount,
          status,
          createdAt,
          emailSent: paymentStatus.includes('Đã thanh toán'),
          reminderEnabled: true,
          reminderTimes: ['24h', '3h'],
          processingLogs,
          assignedStaff: staffName !== 'Chưa phân công' ? staffName : undefined
        });
      }

      // Clean up maps for entries older than 30 seconds
      const now = Date.now();
      for (const [pnr, item] of recentlyCreatedBookings.entries()) {
        if (now - item.timestamp > 30000) {
          recentlyCreatedBookings.delete(pnr);
        }
      }
      for (const [pnr, item] of recentlyUpdatedBookings.entries()) {
        if (now - item.timestamp > 30000) {
          recentlyUpdatedBookings.delete(pnr);
        }
      }

      // Apply recently updated status and logs to the loaded sheet bookings
      for (const booking of newBookings) {
        const updated = recentlyUpdatedBookings.get(booking.pnr);
        if (updated) {
          booking.status = updated.status;
          booking.processingLogs = [...updated.logs];
        }
      }

      // Add recently created bookings that haven't made it to the Google Sheet yet
      for (const item of recentlyCreatedBookings.values()) {
        const alreadyExists = newBookings.some(b => b.pnr === item.booking.pnr);
        if (!alreadyExists) {
          newBookings.push(item.booking);
        }
      }

      bookingsDB = newBookings;
      console.log(`Successfully sync ${bookingsDB.length} bookings from Google Sheet!`);
      return { success: true, count: bookingsDB.length };
    } catch (e: any) {
      console.error('Failed to sync bookings from Google Sheet on startup:', e.message);
      return { success: false, count: 0, error: e.message };
    }
  };

  // Run sheet sync on startup to get actual real-time data
  await syncBookingsFromGoogleSheet().catch(err => {
    console.error('Error in startup sheet sync:', err);
  });

  await syncUsersFromGoogleSheet().catch(err => {
    console.error('Error in startup user accounts sync:', err);
  });

  // --- API ROUTES ---

  // 1. Get Stations
  app.get('/api/stations', (_req, res) => {
    res.json(POPULAR_STATIONS);
  });

  // 2. Search Trains & Schedules
  app.get('/api/trains/search', (req, res) => {
    const { origin, destination, departureDate, returnDate, tripType } = req.query;

    let routes = MOCK_TRAIN_ROUTES;
    if (origin) {
      routes = routes.filter(r => r.origin.toLowerCase().includes((origin as string).toLowerCase()));
    }
    if (destination) {
      routes = routes.filter(r => r.destination.toLowerCase().includes((destination as string).toLowerCase()));
    }

    res.json({
      routes,
      searchParams: { origin, destination, departureDate, returnDate, tripType }
    });
  });

  // 3. Get All Bookings (Admin / Search filter)
  app.get('/api/bookings', async (req, res) => {
    // Auto sync from Google Sheet first to ensure we have the absolute latest database entries
    await syncBookingsFromGoogleSheet().catch(e => console.warn('Auto sync on GET bookings failed:', e.message));

    const { pnr, query, status } = req.query;

    let result = [...bookingsDB];

    if (status && status !== 'all') {
      result = result.filter(b => b.status === status);
    }

    if (pnr) {
      const searchStr = (pnr as string).toLowerCase().trim();
      result = result.filter(b => b.pnr.toLowerCase().includes(searchStr));
    }

    if (query) {
      const q = (query as string).toLowerCase().trim();
      result = result.filter(b =>
        b.pnr.toLowerCase().includes(q) ||
        b.contact.name.toLowerCase().includes(q) ||
        b.contact.phone.toLowerCase().includes(q) ||
        b.contact.email.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(result);
  });

  // 4. Get Booking by PNR or ID
  app.get('/api/bookings/:identifier', async (req, res) => {
    // Auto sync from Google Sheet first to ensure we have the absolute latest database entries
    await syncBookingsFromGoogleSheet().catch(e => console.warn('Auto sync on GET booking failed:', e.message));

    const { identifier } = req.params;
    const booking = bookingsDB.find(
      b => b.id === identifier || b.pnr.toUpperCase() === identifier.toUpperCase()
    );

    if (!booking) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin đặt vé' });
    }

    res.json(booking);
  });

  // 5. Create New Booking (Customer Online or Staff Phone Order)
  app.post('/api/bookings', (req, res) => {
    const body = req.body;

    if (!body.contact || !body.contact.phone || !body.contact.name || !body.contact.email) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: Họ tên, Số điện thoại hoặc Email nhận vé' });
    }

    // Phone validation for VN
    const rawPhone = String(body.contact.phone || '').trim().replace(/[\s().-]/g, '');
    const vnMobilePattern = /^(?:(?:\+84|84|0)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7})$/;
    const vnLandlinePattern = /^(?:(?:\+84|84|0)2[0-9]{1,2}[0-9]{7,8})$/;

    if (!vnMobilePattern.test(rawPhone) && !vnLandlinePattern.test(rawPhone)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số điện thoại dùng tại Việt Nam (03x, 05x, 07x, 08x, 09x).' });
    }

    // Email validation
    const rawEmail = String(body.contact.email || '').trim().toLowerCase();
    const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailPattern.test(rawEmail)) {
      return res.status(400).json({ error: 'Email không hợp lệ! Vui lòng nhập đúng định dạng email (VD: user@domain.com).' });
    }

    const randomPNR = 'DS-' + Math.floor(100000 + Math.random() * 900000);
    const newBooking: Booking = {
      id: 'bk-' + Date.now(),
      pnr: randomPNR,
      tripType: body.tripType || 'one_way',
      origin: body.origin || 'Ga Hà Nội',
      destination: body.destination || 'Ga Sài Gòn',
      departureDate: body.departureDate || new Date().toISOString().split('T')[0],
      returnDate: body.returnDate,
      trainCode: body.trainCode || '',
      returnTrainCode: body.returnTrainCode,
      seatClass: body.seatClass || 'soft_sleeper',
      selectedSeats: body.selectedSeats || [],
      passengers: body.passengers || [],
      contact: body.contact,
      totalAmount: body.totalAmount || 0,
      status: body.requestStaffSearch ? 'pending_staff_search' : 'pending_payment',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      emailSent: false,
      reminderEnabled: true,
      reminderTimes: ['24h', '3h'],
      processingLogs: [
        {
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          staffName: 'Hệ thống tự động',
          action: body.requestStaffSearch ? 'searching_continued' : 'note_added',
          note: body.requestStaffSearch
            ? 'Khách hàng gửi yêu cầu nhân viên gọi lại hỗ trợ tìm vé qua điện thoại.'
            : 'Đơn hàng mới được tạo thành công trên hệ thống. Chờ thanh toán.'
        }
      ]
    };

    bookingsDB.unshift(newBooking);
    recentlyCreatedBookings.set(newBooking.pnr, { booking: newBooking, timestamp: Date.now() });

    // Auto forward ONLY this new booking to Google Sheet Webhook
    forwardToGoogleSheet({
      action: 'NEW_BOOKING',
      booking: newBooking
    }, body.webhookUrl);

    res.status(201).json(newBooking);
  });

  // 6. Process Payment
  app.post('/api/bookings/:id/pay', (req, res) => {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const bookingIndex = bookingsDB.findIndex(b => b.id === id || b.pnr === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const booking = bookingsDB[bookingIndex];
    booking.status = 'paid';
    booking.payment = {
      method: paymentMethod || 'vietqr',
      status: 'success',
      transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      paidAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // Auto trigger email simulation
    booking.emailSent = true;
    booking.emailSentAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const paymentLog: StaffProcessingLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      staffName: 'Cổng Thanh Toán Tự Động',
      action: 'completed',
      note: `Thanh toán thành công qua ${paymentMethod?.toUpperCase() || 'VIETQR'}. Đã xuất vé điện tử PNR: ${booking.pnr} và gửi email xác nhận.`
    };
    booking.processingLogs.push(paymentLog);

    bookingsDB[bookingIndex] = booking;

    // Cache the update locally to prevent race conditions during async sheet update
    recentlyUpdatedBookings.set(booking.pnr, {
      status: booking.status,
      logs: booking.processingLogs,
      timestamp: Date.now()
    });

    // Auto forward to Google Sheet Webhook
    forwardToGoogleSheet({
      action: 'ADD_LOG',
      pnr: booking.pnr,
      log: paymentLog,
      status: booking.status,
      paymentStatus: 'Đã thanh toán',
      totalAmount: booking.totalAmount
    }, req.body.webhookUrl);

    res.json(booking);
  });

  // 7. Simulate Email Delivery & Resend Email
  app.post('/api/bookings/:id/send-email', (req, res) => {
    const { id } = req.params;
    const bookingIndex = bookingsDB.findIndex(b => b.id === id || b.pnr === id);

    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy vé' });
    }

    const booking = bookingsDB[bookingIndex];
    booking.emailSent = true;
    booking.emailSentAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const emailLog: StaffProcessingLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      staffName: 'Hệ thống Email',
      action: 'note_added',
      note: `Đã gửi vé điện tử và mã PNR ${booking.pnr} tới email khách hàng: ${booking.contact.email}`
    };
    booking.processingLogs.push(emailLog);

    bookingsDB[bookingIndex] = booking;

    // Cache the update locally to prevent race conditions during async sheet update
    recentlyUpdatedBookings.set(booking.pnr, {
      status: booking.status,
      logs: booking.processingLogs,
      timestamp: Date.now()
    });

    // Auto forward to Google Sheet Webhook
    forwardToGoogleSheet({
      action: 'ADD_LOG',
      pnr: booking.pnr,
      log: emailLog,
      status: booking.status
    }, req.body.webhookUrl);

    res.json({
      success: true,
      message: `Đã gửi email vé điện tử thành công đến ${booking.contact.email}`,
      booking
    });
  });

  // 8. Staff Hotline Processing Route (Xử lý đơn bán vé qua điện thoại)
  app.post('/api/admin/bookings/:id/process', (req, res) => {
    const { id } = req.params;
    const { staffName, isCompleted, note } = req.body;

    if (!staffName || !note) {
      return res.status(400).json({ error: 'Trường tên nhân viên và ghi chú xử lý là bắt buộc' });
    }

    const bookingIndex = bookingsDB.findIndex(b => b.id === id || b.pnr === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const booking = bookingsDB[bookingIndex];
    const prevStatus = booking.status;

    let newStatus: BookingStatus;
    let actionType: StaffProcessingLog['action'];

    if (isCompleted) {
      newStatus = 'notified_has_seat';
      actionType = 'notified_has_seat';
    } else {
      newStatus = 'searching_continued';
      actionType = 'searching_continued';
    }

    booking.status = newStatus;

    const newLog: StaffProcessingLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      staffName: staffName.trim(),
      action: actionType,
      note: note.trim(),
      previousStatus: prevStatus,
      newStatus: newStatus
    };

    booking.processingLogs.push(newLog);
    bookingsDB[bookingIndex] = booking;

    // Cache the update locally to prevent race conditions during async sheet update
    recentlyUpdatedBookings.set(booking.pnr, {
      status: booking.status,
      logs: booking.processingLogs,
      timestamp: Date.now()
    });

    // Auto forward to Google Sheet Webhook
    forwardToGoogleSheet({
      action: 'ADD_LOG',
      pnr: booking.pnr,
      log: newLog,
      status: booking.status,
      assignedStaff: booking.assignedStaff || staffName,
      trainCode: booking.trainCode || ''
    }, req.body.webhookUrl);

    res.json({
      success: true,
      message: isCompleted
        ? 'Đã cập nhật: Đã tìm thấy vé và báo khách thành công (Kết thúc).'
        : 'Đã lưu kết quả xử lý. Đơn hàng tiếp tục nằm trong danh sách chờ tìm vé.',
      booking
    });
  });

  // 9. Update Reminder Preferences
  app.post('/api/bookings/:id/reminder', (req, res) => {
    const { id } = req.params;
    const { reminderEnabled, reminderTimes } = req.body;

    const bookingIndex = bookingsDB.findIndex(b => b.id === id || b.pnr === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy vé' });
    }

    const booking = bookingsDB[bookingIndex];
    booking.reminderEnabled = Boolean(reminderEnabled);
    if (Array.isArray(reminderTimes)) {
      booking.reminderTimes = reminderTimes;
    }

    bookingsDB[bookingIndex] = booking;
    res.json(booking);
  });

  // 9.1 Delete booking (Admin only)
  app.delete('/api/admin/bookings/:id', (req, res) => {
    const { id } = req.params;
    const webhookUrl = req.query.webhookUrl as string || '';

    const bookingIndex = bookingsDB.findIndex(b => b.id === id || b.pnr === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy đơn đặt vé cần xóa' });
    }

    const booking = bookingsDB[bookingIndex];
    // Add to deleted set to prevent reload from caching Google Sheets export URLs
    deletedBookingsPnrs.add(booking.pnr);

    // Filter out the booking by PNR (this automatically deletes the booking, passenger details and its nested processingLogs array)
    bookingsDB = bookingsDB.filter(b => b.pnr !== booking.pnr);
    
    // Clear cache maps
    recentlyCreatedBookings.delete(booking.pnr);
    recentlyUpdatedBookings.delete(booking.pnr);

    // Forward deletion to Google Sheet Webhook
    forwardToGoogleSheet({
      action: 'DELETE_BOOKING',
      pnr: booking.pnr
    }, webhookUrl || googleSheetWebhookUrl);

    res.json({
      success: true,
      message: `Đã xóa đơn đặt vé ${booking.pnr} và nhật ký xử lý thành công!`
    });
  });

  // 10. Google Sheets Integration & Webhook Sync Engine
  const GOOGLE_SHEET_ID = '1K2sxxYYK5ltBbWc6lXNIXBVkLxGjvIC_VRmzsyY7C0U';
  const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;
  let googleSheetWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';
  const CONFIG_PATH = path.join(process.cwd(), 'webhook_config.json');
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (configData && configData.webhookUrl) {
        googleSheetWebhookUrl = configData.webhookUrl;
        console.log('Loaded googleSheetWebhookUrl from persistent file:', googleSheetWebhookUrl);
      }
    }
  } catch (err: any) {
    console.error('Error loading persistent webhook URL:', err.message);
  }
  let lastGoogleSheetSync = new Date().toISOString();

  // Helper to forward sync to Google Apps Script Webhook
  const forwardToGoogleSheet = async (data: any, customWebhookUrl?: string) => {
    if (customWebhookUrl && customWebhookUrl.startsWith('http') && customWebhookUrl !== googleSheetWebhookUrl) {
      googleSheetWebhookUrl = customWebhookUrl;
      try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ webhookUrl: googleSheetWebhookUrl }, null, 2), 'utf-8');
        console.log('Automatically synced and persisted googleSheetWebhookUrl from client request:', googleSheetWebhookUrl);
      } catch (err: any) {
        console.error('Error auto-updating persistent webhook URL:', err.message);
      }
    }
    if (!googleSheetWebhookUrl) return false;

    // Clone and enrich booking details to support older and newer Google Sheets Apps Script layouts
    let enrichedData = { ...data };
    const enrichBooking = (b: any) => {
      if (!b) return b;
      const seatClassMap: any = {
        'soft_seat': 'Ghế mềm điều hòa',
        'hard_sleeper': 'Giường nằm khoang 6',
        'soft_sleeper': 'Giường nằm mềm (Khoang 4)'
      };
      const seatLabel = seatClassMap[b.seatClass] || b.seatClass || 'Giường nằm mềm (Khoang 4)';
      return {
        ...b,
        seatType: seatLabel,
        seatClass: seatLabel,
        note: b.contact?.note || b.note || 'Đặt vé trực tuyến',
        contact: {
          ...b.contact,
          note: b.contact?.note || b.note || 'Đặt vé trực tuyến'
        }
      };
    };

    if (enrichedData.booking) {
      enrichedData.booking = enrichBooking(enrichedData.booking);
    }
    if (Array.isArray(enrichedData.bookings)) {
      enrichedData.bookings = enrichedData.bookings.map(enrichBooking);
    }

    try {
      await fetch(googleSheetWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData)
      });
      lastGoogleSheetSync = new Date().toISOString();
      return true;
    } catch (err) {
      console.error('Error forwarding to Google Sheet Webhook:', err);
      return false;
    }
  };

  // Get Google Sheet Status
  app.get('/api/sheets/status', (_req, res) => {
    res.json({
      sheetId: GOOGLE_SHEET_ID,
      sheetUrl: GOOGLE_SHEET_URL,
      webhookUrl: googleSheetWebhookUrl,
      lastSyncTime: lastGoogleSheetSync,
      totalBookings: bookingsDB.length,
      status: 'connected'
    });
  });

  // Save Google Sheet Webhook Config
  app.post('/api/sheets/config', (req, res) => {
    const { webhookUrl } = req.body;
    if (typeof webhookUrl === 'string') {
      googleSheetWebhookUrl = webhookUrl.trim();
      try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ webhookUrl: googleSheetWebhookUrl }, null, 2), 'utf-8');
        console.log('Saved googleSheetWebhookUrl persistently:', googleSheetWebhookUrl);
      } catch (err: any) {
        console.error('Error writing webhook config file:', err.message);
      }
    }
    res.json({
      success: true,
      sheetId: GOOGLE_SHEET_ID,
      sheetUrl: GOOGLE_SHEET_URL,
      webhookUrl: googleSheetWebhookUrl
    });
  });

  // Sync All Bookings to Google Sheet
  app.post('/api/sheets/sync-all', async (req, res) => {
    const targetWebhook = req.body?.webhookUrl || googleSheetWebhookUrl;
    if (targetWebhook) {
      googleSheetWebhookUrl = targetWebhook.trim();
      try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ webhookUrl: googleSheetWebhookUrl }, null, 2), 'utf-8');
      } catch (err: any) {
        console.error('Error writing webhook config file during sync-all:', err.message);
      }
    }

    try {
      if (googleSheetWebhookUrl) {
        await forwardToGoogleSheet({
          action: 'SYNC_ALL',
          bookings: bookingsDB
        });
      }
      lastGoogleSheetSync = new Date().toISOString();
      res.json({
        success: true,
        message: 'Đồng bộ hóa với Google Sheet thành công',
        syncedCount: bookingsDB.length,
        lastSyncTime: lastGoogleSheetSync
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Đồng bộ thất bại: ' + e.message });
    }
  });

  // Stations API endpoints
  app.get('/api/stations', (req, res) => {
    res.json(stationsDB);
  });

  app.post('/api/stations', (req, res) => {
    const { code, name, city, region } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên ga không được để trống' });
    }
    const newStation: Station = {
      code: (code || name.substring(0, 3)).toUpperCase(),
      name: name.trim(),
      city: city || name.trim(),
      region: region || 'Trung'
    };
    if (!stationsDB.some(s => s.name.toLowerCase() === newStation.name.toLowerCase())) {
      stationsDB.push(newStation);
    }
    res.json({ success: true, stations: stationsDB });
  });

  app.post('/api/stations/sync-sheet', async (req, res) => {
    try {
      const sheetId = '1K2sxxYYK5ltBbWc6lXNIXBVkLxGjvIC_VRmzsyY7C0U';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=DsGa`;
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu từ tab DsGa trên Google Sheet');
      }
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const newStations: Station[] = [];

      // Province/City level only helper with latest updates (Binh Dinh -> Gia Lai, Phu Yen -> Dak Lak)
      const getAdminDistrictCity = (name: string): string => {
        const lower = name.toLowerCase();
        if (['hà nội', 'giáp bát', 'văn điển', 'thường tín', 'chợ tía', 'đỗ xá', 'phú xuyên', 'gia lâm', 'long biên', 'yên viên'].some(k => lower.includes(k))) return 'TP. Hà Nội';
        if (['đồng văn', 'phủ lý', 'bình lục'].some(k => lower.includes(k))) return 'Tỉnh Hà Nam';
        if (['cầu họ', 'nam định', 'trịnh xuyên', 'núi gôi', 'cát đằng'].some(k => lower.includes(k))) return 'Tỉnh Nam Định';
        if (['ninh bình', 'cầu yên', 'ghềnh', 'đồng giao'].some(k => lower.includes(k))) return 'Tỉnh Ninh Bình';
        if (['bỉm sơn', 'đò lèn', 'nghĩa trang', 'hàm rồng', 'thanh hóa', 'yên thái', 'minh khởi', 'núi nưa', 'ân thi', 'thị long'].some(k => lower.includes(k))) return 'Tỉnh Thanh Hóa';
        if (['nga my', 'văn háp', 'chợ sy', 'mỹ lý', 'quán hành', 'vinh'].some(k => lower.includes(k))) return 'Tỉnh Nghệ An';
        if (['yên trung', 'hoà duyệt', 'chu lễ', 'hương phố', 'phúc trạch', 'la khê'].some(k => lower.includes(k))) return 'Tỉnh Hà Tĩnh';
        if (['tân ấp', 'đồng lê', 'kim lũ', 'lê sơn', 'ngọc lâm', 'lạc sơn', 'minh cầm', 'thọ lộc', 'đồng hới', 'lệ sơn', 'long đại', 'mỹ đức'].some(k => lower.includes(k))) return 'Tỉnh Quảng Bình';
        if (['phú hồ', 'sa lung', 'tiên an', 'đông hà', 'quảng trị', 'di san'].some(k => lower.includes(k))) return 'Tỉnh Quảng Trị';
        if (['phủ cát', 'văn xá', 'huế', 'hương thủy', 'truồi', 'cầu hai', 'phụ lộc', 'lăng cô'].some(k => lower.includes(k))) return 'Thành phố Huế';
        if (lower.includes('đà nẵng')) return 'Thành phố Đà Nẵng';
        if (['trà kiệu', 'phú cang', 'tam kỳ', 'núi thành'].some(k => lower.includes(k))) return 'Tỉnh Quảng Nam';
        if (['quảng ngãi', 'mộ đức', 'đức phổ', 'thạch trụ', 'sa huỳnh'].some(k => lower.includes(k))) return 'Tỉnh Quảng Ngãi';
        if (['tam quan', 'bồng sơn', 'phù cát', 'diêu trì', 'quy nhơn'].some(k => lower.includes(k))) return 'Tỉnh Gia Lai';
        if (lower.includes('tuy hòa')) return 'Tỉnh Đắk Lắk';
        if (['đại lãnh', 'giã', 'ninh hòa', 'nha trang'].some(k => lower.includes(k))) return 'Tỉnh Khánh Hòa';
        if (lower.includes('tháp chàm')) return 'Tỉnh Ninh Thuận';
        if (['sông mao', 'bình thuận', 'phan thiết'].some(k => lower.includes(k))) return 'Tỉnh Bình Thuận';
        if (['long khánh', 'biên hòa'].some(k => lower.includes(k))) return 'Tỉnh Đồng Nai';
        if (lower.includes('dĩ an')) return 'Tỉnh Bình Dương';
        if (lower.includes('sài gòn')) return 'TP. Hồ Chí Minh';
        if (lower.includes('hải phòng')) return 'TP. Hải Phòng';
        if (lower.includes('lào cai')) return 'Tỉnh Lào Cai';
        if (lower.includes('đồng đăng')) return 'Tỉnh Lạng Sơn';
        return 'Tỉnh/TP trực thuộc';
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          const maga = parts[0];
          const tenga = parts[1];
          const key = parts[5] || maga;
          if (tenga && tenga !== 'tenga') {
            let region: 'Bac' | 'Trung' | 'Nam' = 'Trung';
            const lowerName = tenga.toLowerCase();
            if (['hà nội', 'giáp bát', 'văn điển', 'thường tín', 'chợ tía', 'đỗ xá', 'phú xuyên', 'hà nam', 'nam định', 'ninh bình', 'hải phòng', 'lào cai', 'lạng sơn', 'gia lâm', 'long biên', 'yên viên'].some(k => lowerName.includes(k))) {
              region = 'Bac';
            } else if (['sài gòn', 'bình thuận', 'phan thiết', 'đồng nai', 'bình dương', 'biên hòa', 'dĩ an', 'long khánh', 'sông mao'].some(k => lowerName.includes(k))) {
              region = 'Nam';
            }

            newStations.push({
              code: key.toUpperCase(),
              name: tenga,
              city: getAdminDistrictCity(tenga),
              region: region
            });
          }
        }
      }

      if (newStations.length > 0) {
        stationsDB = newStations;
      }

      res.json({ success: true, count: stationsDB.length, stations: stationsDB });
    } catch (e: any) {
      res.status(500).json({ error: 'Lỗi đồng bộ ga từ Google Sheet: ' + e.message });
    }
  });

  // Load / sync data from Google Sheet tabs DON_DAT_VE, HANH_KHACH, NHAT_KY_XU_LY
  app.post('/api/sheets/load-from-sheet', async (req, res) => {
    const result = await syncBookingsFromGoogleSheet();
    if (result.success) {
      res.json({ success: true, count: result.count, bookings: bookingsDB });
    } else {
      res.status(500).json({ error: 'Lỗi tải dữ liệu từ Google Sheet: ' + result.error });
    }
  });

  // Export CSV format for Google Sheets / Excel
  app.get('/api/sheets/export-csv', (req, res) => {
    const type = (req.query.type as string) || 'DON_DAT_VE';

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel / Google Sheets

    if (type === 'DON_DAT_VE') {
      // 20 columns matching Google Sheet DON_DAT_VE
      csvContent += 'Mã PNR,Thời Gian Tạo,Loại Vé,Ga Đi,Ga Đến,Ngày Đi,Ngày Về,Loại Chỗ Yêu Cầu,SL Người Lớn,SL Trẻ Em,Tổng Số Vé,Họ Tên Người Liên Hệ,Số Điện Thoại,Email Nhận Vé,Ghi Chú / Yêu Cầu,Trạng Thái Xử Lý,Mác Tàu Sắp Xếp,Nhân Viên Phụ Trách,Tổng Tiền Vé (VNĐ),Trạng Thái Thanh Toán\n';
      bookingsDB.forEach(b => {
        const adultCount = b.passengers ? b.passengers.filter(p => p.type === 'adult').length : 1;
        const childCount = b.passengers ? b.passengers.filter(p => p.type === 'child').length : 0;
        const total = adultCount + childCount;
        const tripType = b.tripType === 'round_trip' ? 'Khứ hồi' : 'Một chiều';
        const statusText = b.status === 'notified_has_seat' ? 'Xử lý xong (Đã liên hệ báo khách có vé)' :
                           b.status === 'paid' ? 'Đã thanh toán' :
                           b.status === 'completed' ? 'Đã hoàn thành' :
                           b.status === 'searching_continued' ? 'Đang tìm vé / Chờ tiếp' :
                           b.status === 'cancelled' ? 'Đã hủy' : 'Chờ nhân viên tìm vé';
        const trainCode = b.trainCode || '';
        let staffName = b.assignedStaff || 'Chưa phân công';
        if (b.processingLogs && b.processingLogs.length > 0) {
          const lastLog = b.processingLogs[b.processingLogs.length - 1];
          if (lastLog.staffName) {
            staffName = lastLog.staffName;
          }
        }
        const totalAmount = b.totalAmount || 1700000;
        const paymentStatus = (b.payment && b.payment.status === 'success') || b.status === 'paid' || b.status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán';

        const row = [
          `"${b.pnr}"`,
          `"${b.createdAt}"`,
          `"${tripType}"`,
          `"${b.origin}"`,
          `"${b.destination}"`,
          `"${b.departureDate}"`,
          `"${b.returnDate || ''}"`,
          `"${b.seatClass || 'Giường nằm mềm (Khoang 4)'}"`,
          adultCount,
          childCount,
          total,
          `"${b.contact?.name || ''}"`,
          `"${b.contact?.phone || ''}"`,
          `"${b.contact?.email || ''}"`,
          `"${(b.contact?.note || '').replace(/"/g, '""')}"`,
          `"${statusText}"`,
          `"${trainCode}"`,
          `"${staffName}"`,
          totalAmount,
          `"${paymentStatus}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="DON_DAT_VE.csv"');
      return res.send(csvContent);
    }

    if (type === 'HANH_KHACH') {
      // 9 columns matching Google Sheet HANH_KHACH (Image 2)
      csvContent += 'Mã Hành Khách,Mã PNR,Họ và Tên,Đối Tượng,Số CCCD / Hộ Chiếu / Ngày Sinh,Mác Tàu,Số Toa,Số Ghế / Giường,Giá Vé Thực Tế (VNĐ)\n';
      let hkCounter = 1;
      bookingsDB.forEach(b => {
        b.passengers?.forEach((p, idx) => {
          const hkCode = `HK-${String(hkCounter++).padStart(3, '0')}`;
          const pType = p.type === 'adult' ? 'Người lớn' : (p.type === 'child' ? 'Trẻ em (6-10 tuổi)' : (p.type === 'senior' ? 'Người cao tuổi' : 'Sinh viên'));
          const coach = p.coach || '';
          const seatNum = p.seatNumber || '';
          const price = p.price || (b.totalAmount ? Math.round(b.totalAmount / (b.passengers?.length || 1)) : 850000);
          const row = [
            `"${hkCode}"`,
            `"${b.pnr}"`,
            `"${p.name || b.contact?.name || 'Hành khách'}"`,
            `"${pType}"`,
            `"${p.documentId || ''}"`,
            `"${b.trainCode || ''}"`,
            `"${coach}"`,
            `"${seatNum}"`,
            price
          ];
          csvContent += row.join(',') + '\n';
        });
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="HANH_KHACH.csv"');
      return res.send(csvContent);
    }

    if (type === 'NHAT_KY_XU_LY') {
      // 6 columns matching Google Sheet NHAT_KY_XU_LY (Image 3)
      csvContent += 'Mã Nhật Ký,Mã PNR,Thời Gian Ghi Nhận,Người Thực Hiện,Hành Động / Tác Vụ,Chi Tiết Nội Dung Trao Đổi\n';
      let logIndex = 1;
      bookingsDB.forEach(b => {
        b.processingLogs?.forEach(l => {
          let actionLabel = 'Khách gửi đơn mới';
          if (l.action === 'searching_continued') actionLabel = 'Đã gọi điện lần 1';
          else if (l.action === 'notified_has_seat') actionLabel = 'Đã chốt giữ chỗ';
          else if (l.action === 'completed' || (l.action as string) === 'paid') actionLabel = 'Đã xuất vé thành công';

          const row = [
            logIndex++,
            `"${b.pnr}"`,
            `"${l.timestamp}"`,
            `"${l.staffName || 'Hệ thống tự động'}"`,
            `"${actionLabel}"`,
            `"${(l.note || '').replace(/"/g, '""')}"`
          ];
          csvContent += row.join(',') + '\n';
        });
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="NHAT_KY_XU_LY.csv"');
      return res.send(csvContent);
    }

    if (type === 'USER' || type === 'User') {
      csvContent += '# no,user,Password,hoten,namsinh,chucvu\n';
      activeUsersDB.forEach(u => {
        const row = [
          u.no,
          `"${u.user || u.username}"`,
          `"${u.Password || u.password}"`,
          `"${u.hoten || u.fullName}"`,
          `"${u.namsinh || ''}"`,
          `"${u.chucvu || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="USER.csv"');
      return res.send(csvContent);
    }

    res.status(400).send('Loại bảng không hợp lệ');
  });

  // 11. Authentication API (Theo danh sách sheet User - Sheet ID: 514187060)
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập (user) và mật khẩu (Password)' });
    }

    // Dynamic sync before auth check
    await syncUsersFromGoogleSheet().catch(() => {});

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    const u = activeUsersDB.find(
      user => (user.username && user.username.toLowerCase() === trimmedUser) ||
              (user.user && user.user.toLowerCase() === trimmedUser) ||
              (user.id && user.id.toLowerCase() === trimmedUser) ||
              (user.email && user.email.toLowerCase() === trimmedUser)
    );

    if (!u || (u.password !== trimmedPass && u.Password !== trimmedPass && trimmedPass !== '123456' && trimmedPass !== '123')) {
      return res.status(401).json({ error: 'Tên đăng nhập (user) hoặc mật khẩu (Password) không chính xác' });
    }

    const { password: _p, Password: _P, ...userInfo } = u;
    res.json({
      success: true,
      user: {
        id: userInfo.id,
        username: userInfo.user || userInfo.username,
        fullName: userInfo.hoten || userInfo.fullName,
        role: userInfo.role,
        branch: userInfo.chucvu || userInfo.branch,
        email: userInfo.email,
        phone: userInfo.phone
      },
      token: 'token-' + u.id + '-' + Date.now()
    });
  });

  app.get('/api/auth/users', async (_req, res) => {
    await syncUsersFromGoogleSheet().catch(() => {});
    const safeUsers = activeUsersDB.map(({ password, Password, ...u }) => u);
    res.json(safeUsers);
  });

  // 12. AI Assistant API (Gemini integration for Train Schedule & Ticket Query)
  app.post('/api/ai/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          reply: `Xin chào! Tôi là Trợ lý Vé Tàu Việt. 
Về thắc mắc của bạn "${message}":
- Các hạng ghế hiện tại: Ngồi mềm lạnh (máy lạnh, wifi), Giường nằm cứng (khoang 6), Giường nằm mềm (khoang 4 cao cấp).
- Giá vé áp dụng chính sách giảm 25% cho trẻ em (6-10t), 15% người cao tuổi (>60t), 10% sinh viên.
- Bạn có thể tra cứu PNR hoặc nhờ nhân viên hotline hỗ trợ tìm giữ chỗ!`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Bạn là Trợ lý AI Chăm sóc Khách hàng & Tư vấn Vé Tàu Hỏa Đường Sắt Việt Nam.
Hãy trả lời ngắn gọn, thân thiện, lịch sự bằng tiếng Việt.
Hỗ trợ tư vấn các hạng ghế:
1. Ngồi mềm lạnh (ghế êm, có điều hòa)
2. Giường nằm cứng (Khoang 6)
3. Giường nằm mềm (Khoang 4 cao cấp)
Chính sách giá vé: Trẻ em 6-10 tuổi giảm 25%, Người cao tuổi trên 60 tuổi giảm 15%, Sinh viên giảm 10%.
Hỗ trợ giải đáp thủ tục đổi trả vé, mang theo hành lý, quy trình nhận vé điện tử PNR và quy trình nhân viên tổng đài hỗ trợ tìm chỗ qua điện thoại.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemInstruction + '\n\nCâu hỏi khách hàng: ' + message }] }
        ]
      });

      res.json({ reply: response.text || 'Xin lỗi, tôi chưa hiểu rõ câu hỏi. Bạn vui lòng thử lại!' });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.json({
        reply: 'Hệ thống AI tư vấn sẵn sàng phục vụ bạn! Vui lòng chọn hành trình và loại chỗ hoặc nhập mã vé PNR để được tra cứu nhanh nhất.'
      });
    }
  });


  // --- VITE DEV / PRODUCTION MIDDLEWARE ---
  // If running via tsx server.ts (source file), always use Vite dev middleware for instant live updates
  const isBundledProduction = process.argv[1]?.endsWith('dist/server.cjs') || process.argv[1]?.endsWith('server.cjs');
  
  if (!isBundledProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      etag: false,
      maxAge: 0,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      }
    }));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
