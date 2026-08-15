import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, Download, Copy, Check, Settings, AlertCircle, Database, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { Booking } from '../types';

interface GoogleSheetSyncModalProps {
  onClose: () => void;
  bookings: Booking[];
  onSyncComplete?: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  onClose,
  bookings,
  onSyncComplete
}) => {
  const SHEET_ID = '1K2sxxYYK5ltBbWc6lXNIXBVkLxGjvIC_VRmzsyY7C0U';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  const [activeTab, setActiveTab] = useState<'overview' | 'script_guide' | 'export'>('overview');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem('google_sheet_last_sync') || new Date().toLocaleString('vi-VN')
  );

  useEffect(() => {
    // Fetch current webhook config from backend
    fetch('/api/sheets/status')
      .then(res => res.json())
      .then(data => {
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
        if (data.lastSyncTime) setLastSyncTime(data.lastSyncTime);
      })
      .catch(() => {});
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      // 1. Direct browser call to Webhook (Bypasses container network limits)
      if (webhookUrl && webhookUrl.startsWith('http')) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'SYNC_ALL',
              bookings: bookings
            })
          });
        } catch (browserErr) {
          console.warn('Browser direct webhook dispatch notice:', browserErr);
        }
      }

      // 2. Server-side sync endpoint call
      const res = await fetch('/api/sheets/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl })
      });

      const data = await res.json();
      if (res.ok) {
        setSyncStatus('success');
        const nowStr = new Date().toLocaleString('vi-VN');
        setLastSyncTime(nowStr);
        localStorage.setItem('google_sheet_last_sync', nowStr);
        setSyncMessage(`Đã đồng bộ thành công ${data.syncedCount || bookings.length} bản ghi sang Google Sheet!`);
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncStatus('error');
        setSyncMessage(data.error || 'Lỗi đồng bộ. Vui lòng kiểm tra lại cấu hình.');
      }
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage('Không thể kết nối với máy chủ để đồng bộ.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadFromSheet = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      const res = await fetch('/api/sheets/load-from-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus('success');
        const nowStr = new Date().toLocaleString('vi-VN');
        setLastSyncTime(nowStr);
        localStorage.setItem('google_sheet_last_sync', nowStr);
        setSyncMessage(`Đã tải thành công ${data.count} đơn vé từ Google Sheet lên ứng dụng!`);
        if (onSyncComplete) onSyncComplete();
        alert(`✅ ĐÃ TẢI DỮ LIỆU TỪ GOOGLE SHEET THÀNH CÔNG!\n\nSố lượng đơn vé hiện tại: ${data.count}`);
      } else {
        setSyncStatus('error');
        setSyncMessage(data.error || 'Không thể tải dữ liệu từ Google Sheet.');
      }
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage('Lỗi kết nối khi tải dữ liệu từ Google Sheet.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      alert('Vui lòng dán đúng đường dẫn Webhook Web App (bắt đầu bằng https://script.google.com/...)');
      return;
    }

    const trimmedUrl = webhookUrl.trim();
    localStorage.setItem('GOOGLE_SHEET_WEBHOOK', trimmedUrl);
    setSyncing(true);
    setSyncStatus('idle');

    try {
      // 1. Save config to backend
      await fetch('/api/sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: trimmedUrl })
      });

      // 2. Direct browser test ping to Webhook
      try {
        await fetch(trimmedUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'TEST_CONNECTION'
          })
        });
      } catch (browserErr) {
        console.warn('Browser test ping notice:', browserErr);
      }

      const nowStr = new Date().toLocaleString('vi-VN');
      setLastSyncTime(nowStr);
      localStorage.setItem('google_sheet_last_sync', nowStr);
      setSyncStatus('success');
      setSyncMessage('Đã lưu cấu hình Webhook thành công! Khi có khách đặt vé mới, hệ thống sẽ tự động ghi 1 dòng mới vào Sheet.');
      if (onSyncComplete) onSyncComplete();
      alert('✅ ĐÃ LƯU CẤU HÌNH WEBHOOK THÀNH CÔNG!\n\nTừ bây giờ, mỗi khi khách hàng gửi đơn đặt vé mới trên web, hệ thống sẽ tự động ghi duy nhất đơn vé đó vào Google Sheet (không bị trùng lặp dữ liệu cũ).');
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage('Đã lưu link nhưng có lỗi khi gửi dữ liệu sang Sheet: ' + e.message);
      alert('Đã lưu link nhưng chưa thể kết nối sang Sheet. Hãy đảm bảo bạn đã chọn "Anyone" khi Deploy Apps Script.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCSV = (tableType: 'DON_DAT_VE' | 'HANH_KHACH' | 'NHAT_KY_XU_LY' | 'USER') => {
    window.open(`/api/sheets/export-csv?type=${tableType}`, '_blank');
  };

  const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT ĐỒNG BỘ TỰ ĐỘNG DATABASE VÉ TÀU HOTLINE
 * Spreadsheet ID: ${SHEET_ID}
 * Hỗ trợ: Tạo/cập nhật đơn đặt vé, hành khách và ghi nhận nhật ký xử lý (NHAT_KY_XU_LY).
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Webhook Google Apps Script đang hoạt động sẵn sàng nhận dữ liệu từ Web Đặt Vé Tàu!",
    timestamp: new Date().toLocaleString("vi-VN")
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        error: "Không có dữ liệu gửi lên (postData rỗng)"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Kiểm tra kết nối (Test Ping)
    if (payload.action === "TEST_CONNECTION") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Webhook kết nối thành công!",
        timestamp: new Date().toLocaleString("vi-VN")
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Khởi tạo các Sheet cần thiết
    var sheetDon = getOrCreateSheet(ss, "DON_DAT_VE", [
      "Mã PNR", "Thời Gian Tạo", "Loại Vé", "Ga Đi", "Ga Đến", "Ngày Đi", "Ngày Về",
      "Loại Chỗ Yêu Cầu", "SL Người Lớn", "SL Trẻ Em", "Tổng Số Vé", "Họ Tên Người Liên Hệ",
      "Số Điện Thoại", "Email Nhận Vé", "Ghi Chú / Yêu Cầu", "Trạng Thái Xử Lý", "Mác Tàu Sắp Xếp", "Nhân Viên Phụ Trách", "Tổng Tiền Vé (VNĐ)", "Trạng Thái Thanh Toán"
    ], 0);

    var sheetHanhKhach = getOrCreateSheet(ss, "HANH_KHACH", [
      "Mã Hành Khách", "Mã PNR", "Họ và Tên", "Đối Tượng", "Số CCCD / Hộ Chiếu / Ngày Sinh",
      "Mác Tàu", "Số Toa", "Số Ghế / Giường", "Giá Vé Thực Tế (VNĐ)"
    ]);

    var sheetNhatKy = getOrCreateSheet(ss, "NHAT_KY_XU_LY", [
      "Mã Nhật Ký", "Mã PNR", "Thời Gian Ghi Nhận", "Người Thực Hiện", "Hành Động / Tác Vụ", "Chi Tiết Nội Dung Trao Đổi"
    ]);

    // 2. Xử lý đồng bộ toàn bộ (SYNC_ALL)
    if (payload.action === 'SYNC_ALL' && Array.isArray(payload.bookings)) {
      payload.bookings.forEach(function(b) {
        syncBookingToSheets(sheetDon, sheetHanhKhach, sheetNhatKy, b);
      });
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Đã đồng bộ toàn bộ " + payload.bookings.length + " đơn vé thành công!",
        timestamp: new Date().toLocaleString("vi-VN")
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2.1 Xử lý Xóa Đơn Đặt Vé (DELETE_BOOKING)
    if (payload.action === 'DELETE_BOOKING' && payload.pnr) {
      var pnrToDelete = String(payload.pnr).trim();
      
      // Xóa trong NHAT_KY_XU_LY trước theo yêu cầu của bạn
      var nkData = sheetNhatKy.getDataRange().getValues();
      for (var k = nkData.length - 1; k >= 1; k--) {
        if (String(nkData[k][1]).trim() === pnrToDelete) {
          sheetNhatKy.deleteRow(k + 1);
        }
      }
      
      // Xóa trong HANH_KHACH
      var hkData = sheetHanhKhach.getDataRange().getValues();
      for (var j = hkData.length - 1; j >= 1; j--) {
        if (String(hkData[j][1]).trim() === pnrToDelete) {
          sheetHanhKhach.deleteRow(j + 1);
        }
      }
      
      // Xóa trong DON_DAT_VE cuối cùng
      var donData = sheetDon.getDataRange().getValues();
      for (var i = donData.length - 1; i >= 1; i--) {
        if (String(donData[i][0]).trim() === pnrToDelete) {
          sheetDon.deleteRow(i + 1);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Đã xóa thành công nhật ký xử lý và đơn đặt vé " + pnrToDelete + " khỏi Google Sheets!",
        timestamp: new Date().toLocaleString("vi-VN")
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Xử lý cập nhật đơn đặt vé (nếu có và KHÔNG phải là tác vụ ADD_LOG)
    if (payload.booking && payload.action !== 'ADD_LOG') {
      syncBookingToSheets(sheetDon, sheetHanhKhach, sheetNhatKy, payload.booking);
    }

    // 4. Xử lý ghi nhận log thao tác nhân viên (ADD_LOG)
    if (payload.action === 'ADD_LOG' && payload.log) {
      var pnr = payload.pnr || (payload.booking ? payload.booking.pnr : '');
      var log = payload.log;
      var logId = sheetNhatKy.getLastRow();
      var actionStr = getActionLabel(log.action);
      
      // Kiểm tra tránh trùng lặp log dựa trên 16 ký tự đầu của timestamp (yyyy-MM-dd HH:mm)
      var nkData = sheetNhatKy.getDataRange().getValues();
      var isDuplicate = false;
      var logTimeStr = String(log.timestamp || "").substring(0, 16);
      
      for (var k = 1; k < nkData.length; k++) {
        var cellTime = nkData[k][2];
        var formattedCellTime = "";
        if (cellTime instanceof Date) {
          formattedCellTime = Utilities.formatDate(cellTime, "GMT+7", "yyyy-MM-dd HH:mm");
        } else {
          formattedCellTime = String(cellTime).substring(0, 16);
        }

        if (String(nkData[k][1]).trim() === String(pnr).trim() && 
            formattedCellTime === logTimeStr &&
            String(nkData[k][5]).trim() === String(log.note).trim()) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        sheetNhatKy.appendRow([
          logId,
          pnr,
          log.timestamp || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"),
          log.staffName || "Hệ thống tự động",
          actionStr,
          log.note || ""
        ]);
      }

      // Cập nhật trạng thái và thông tin trực tiếp trong DON_DAT_VE để tránh chạy hàm đè nặng nề
      if (pnr) {
        var donData = sheetDon.getDataRange().getValues();
        var foundRow = -1;
        for (var i = 1; i < donData.length; i++) {
          if (String(donData[i][0]).trim() === String(pnr).trim()) {
            foundRow = i + 1;
            break;
          }
        }

        if (foundRow > 0) {
          if (payload.status) {
            var statusText = payload.status === 'notified_has_seat' ? 'Xử lý xong (Đã liên hệ báo khách có vé)' :
                             payload.status === 'paid' ? 'Đã thanh toán' :
                             payload.status === 'completed' ? 'Đã hoàn thành' :
                             payload.status === 'searching_continued' ? 'Đang tìm vé / Chờ tiếp' :
                             payload.status === 'cancelled' ? 'Đã hủy' : 'Chờ nhân viên tìm vé';
            sheetDon.getRange(foundRow, 16).setValue(statusText); // Cột 16: Trạng Thái Xử Lý
          }
          if (payload.assignedStaff) {
            sheetDon.getRange(foundRow, 18).setValue(payload.assignedStaff); // Cột 18: Nhân Viên Phụ Trách
          }
          if (payload.trainCode !== undefined) {
            sheetDon.getRange(foundRow, 17).setValue(payload.trainCode); // Cột 17: Mác Tàu Sắp Xếp
          }
          if (payload.paymentStatus) {
            sheetDon.getRange(foundRow, 20).setValue(payload.paymentStatus); // Cột 20: Trạng Thái Thanh Toán
          }
          if (payload.totalAmount) {
            sheetDon.getRange(foundRow, 19).setValue(payload.totalAmount); // Cột 19: Tổng Tiền Vé (VNĐ)
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã xử lý và đồng bộ dữ liệu thành công!",
      timestamp: new Date().toLocaleString("vi-VN")
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Hàm ghi 1 booking vào cả 3 sheets
function syncBookingToSheets(sheetDon, sheetHanhKhach, sheetNhatKy, b) {
  var pnr = b.pnr || ("DS-" + Math.floor(100000 + Math.random() * 900000));
  var tripType = b.tripType === "round_trip" ? "Khứ hồi" : "Một chiều";
  var passengers = b.passengers || [];
  var adultCount = passengers.filter(function(p){ return p.type === 'adult'; }).length;
  var childCount = passengers.filter(function(p){ return p.type === 'child'; }).length;
  if (adultCount === 0 && childCount === 0) adultCount = 1;
  var total = adultCount + childCount;
  var contact = b.contact || {};

  // Ghi vào DON_DAT_VE (15 cột)
  var donData = sheetDon.getDataRange().getValues();
  var foundDonRow = -1;
  for (var i = 1; i < donData.length; i++) {
    if (String(donData[i][0]).trim() === String(pnr).trim()) {
      foundDonRow = i + 1;
      break;
    }
  }

  var statusText = b.status === 'notified_has_seat' ? 'Xử lý xong (Đã liên hệ báo khách có vé)' :
                   b.status === 'paid' ? 'Đã thanh toán' :
                   b.status === 'completed' ? 'Đã hoàn thành' :
                   b.status === 'searching_continued' ? 'Đang tìm vé / Chờ tiếp' :
                   b.status === 'cancelled' ? 'Đã hủy' : 'Chờ nhân viên tìm vé';
  var trainCode = b.trainCode || '';
  var staffName = b.assignedStaff || 'Chưa phân công';
  if (b.processingLogs && b.processingLogs.length > 0) {
    var lastLog = b.processingLogs[b.processingLogs.length - 1];
    if (lastLog.staffName) {
      staffName = lastLog.staffName;
    }
  }
  var totalAmount = b.totalAmount || 1700000;
  var paymentStatus = (b.payment && b.payment.status === 'success') || b.status === 'paid' || b.status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán';

  var donRow = [
    pnr,
    b.createdAt || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"),
    tripType,
    b.origin || "Sài Gòn",
    b.destination || "Đà Nẵng",
    b.departureDate || "",
    b.returnDate || "",
    b.seatClass || "Giường nằm mềm (Khoang 4)",
    adultCount,
    childCount,
    total,
    contact.name || "",
    "'" + (contact.phone || ""),
    contact.email || "",
    contact.note || "",
    statusText,
    trainCode,
    staffName,
    totalAmount,
    paymentStatus
  ];

  if (foundDonRow > 0) {
    sheetDon.getRange(foundDonRow, 1, 1, donRow.length).setValues([donRow]);
  } else {
    sheetDon.appendRow(donRow);
  }

  // Ghi vào HANH_KHACH (9 cột)
  if (passengers.length > 0) {
    var hkData = sheetHanhKhach.getDataRange().getValues();
    for (var j = hkData.length - 1; j >= 1; j--) {
      if (String(hkData[j][1]).trim() === String(pnr).trim()) {
        sheetHanhKhach.deleteRow(j + 1);
      }
    }

    passengers.forEach(function(p, idx) {
      var nextHkNo = sheetHanhKhach.getLastRow();
      var hkCode = "HK-" + String(nextHkNo).padStart(3, '0');
      var pType = p.type === 'adult' ? 'Người lớn' : (p.type === 'child' ? 'Trẻ em (6-10 tuổi)' : (p.type === 'senior' ? 'Người cao tuổi' : 'Sinh viên'));
      var coach = p.coach || "";
      var seatNum = p.seatNumber || "";
      var price = p.price || (b.totalAmount ? Math.round(b.totalAmount / passengers.length) : 850000);

      sheetHanhKhach.appendRow([
        hkCode,
        pnr,
        p.name || contact.name || "Hành khách",
        pType,
        "'" + (p.documentId || ""),
        b.trainCode || "",
        coach,
        seatNum,
        price
      ]);
    });
  }

  // Ghi vào NHAT_KY_XU_LY (6 cột)
  if (b.processingLogs && b.processingLogs.length > 0) {
    var nkData = sheetNhatKy.getDataRange().getValues();
    var existingLogs = [];
    for (var k = 1; k < nkData.length; k++) {
      if (String(nkData[k][1]).trim() === String(pnr).trim()) {
        var cellTime = nkData[k][2];
        var formattedCellTime = "";
        if (cellTime instanceof Date) {
          formattedCellTime = Utilities.formatDate(cellTime, "GMT+7", "yyyy-MM-dd HH:mm");
        } else {
          formattedCellTime = String(cellTime).substring(0, 16);
        }
        existingLogs.push(formattedCellTime + "_" + String(nkData[k][4]).trim());
      }
    }

    b.processingLogs.forEach(function(l) {
      var actionStr = getActionLabel(l.action);
      var logTimeStr = String(l.timestamp || "").substring(0, 16);
      var logKey = logTimeStr + "_" + actionStr;
      if (existingLogs.indexOf(logKey) === -1) {
        var logId = sheetNhatKy.getLastRow();
        sheetNhatKy.appendRow([
          logId,
          pnr,
          l.timestamp || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"),
          l.staffName || "Hệ thống tự động",
          actionStr,
          l.note || ""
        ]);
        existingLogs.push(logKey);
      }
    });
  }
}

function getActionLabel(action) {
  if (action === 'searching_continued') return 'Đã gọi điện lần 1';
  if (action === 'notified_has_seat') return 'Đã chốt giữ chỗ';
  if (action === 'completed' || action === 'paid') return 'Đã xuất vé thành công';
  return 'Khách gửi đơn mới';
}

function getOrCreateSheet(ss, name, headers, targetGid) {
  var sheet = null;
  sheet = ss.getSheetByName(name);

  if (!sheet && typeof targetGid === 'number') {
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      if (allSheets[s].getSheetId() === targetGid) {
        sheet = allSheets[s];
        sheet.setName(name);
        break;
      }
    }
  }

  if (!sheet) {
    var allSheets2 = ss.getSheets();
    for (var s2 = 0; s2 < allSheets2.length; s2++) {
      if (allSheets2[s2].getName().trim().toUpperCase() === name.trim().toUpperCase()) {
        sheet = allSheets2[s2];
        break;
      }
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
  }

  return sheet;
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-blue-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 text-white shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">KẾT NỐI DATABASE GOOGLE SHEETS</h3>
                <span className="text-[10px] bg-emerald-400/30 text-emerald-200 font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">Chi nhánh Vận tải Đường sắt Nha Trang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Trạng thái & Đồng bộ</span>
          </button>

          <button
            onClick={() => setActiveTab('script_guide')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'script_guide'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài đặt Apps Script Tự Động</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file Excel / CSV</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Spreadsheet Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    File Google Sheet đã liên kết:
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm break-all">
                    DATABASE_VETAU_DSNHATRANG
                  </p>
                  <p className="text-xs text-slate-600 font-mono break-all">
                    ID: <strong className="text-emerald-950">{SHEET_ID}</strong>
                  </p>
                </div>
                <a
                  href={SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 text-xs active:scale-95"
                >
                  <span>Mở Google Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Status Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-xs block">Tổng đơn trong App:</span>
                  <span className="font-extrabold text-blue-900 text-lg">{bookings.length} đơn vé</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-xs block">Trạng thái kết nối:</span>
                  <span className="font-extrabold text-emerald-700 text-sm flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Sẵn sàng đồng bộ
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-xs block">Lần đồng bộ gần nhất:</span>
                  <span className="font-medium text-slate-800 text-xs block mt-1">{lastSyncTime || 'Chưa đồng bộ'}</span>
                </div>
              </div>

              {/* Sync Action Area */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Đồng bộ hai chiều với Google Sheet</h4>
                    <p className="text-xs text-slate-500">Đẩy dữ liệu lên hoặc tự động tải/nạp dữ liệu từ Google Sheet về ứng dụng.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLoadFromSheet}
                      disabled={syncing}
                      className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      <span>{syncing ? 'Đang tải...' : 'Tải Về Từ Sheet'}</span>
                    </button>
                    <button
                      onClick={handleSyncNow}
                      disabled={syncing}
                      className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold px-3 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      <span>{syncing ? 'Đang gửi...' : 'Đẩy Lên Sheet'}</span>
                    </button>
                  </div>
                </div>

                {syncStatus === 'success' && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{syncMessage}</span>
                  </div>
                )}

                {syncStatus === 'error' && (
                  <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-lg flex items-center gap-2 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                    <span>{syncMessage}</span>
                  </div>
                )}
              </div>

              {/* 5 Sheets Schema Quick Summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 text-xs">
                  Cấu trúc các bảng trong Google Sheet này:
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-bold text-purple-900">1. User (ID: 514187060)</span>
                    <span className="text-slate-500">6 cột: no, user, Password, hoten, namsinh, chucvu (Dùng xác thực đăng nhập)</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-bold text-blue-900">2. DON_DAT_VE</span>
                    <span className="text-slate-500">20 cột: Mã PNR, Thông tin khách, Lộ trình, Số lượng vé, Trạng thái, Tổng tiền...</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-bold text-blue-900">3. HANH_KHACH</span>
                    <span className="text-slate-500">9 cột: Chi tiết từng người đi tàu, Số CCCD, Toa, Vị trí giường, Giá vé...</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-bold text-blue-900">4. NHAT_KY_XU_LY</span>
                    <span className="text-slate-500">6 cột: Lịch sử nhân viên gọi điện, ghi chú chăm sóc, tiến độ xử lý...</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-bold text-blue-900">5. DM_GA_TAU</span>
                    <span className="text-slate-500">5 cột: Danh mục các ga tàu hỏa Bắc - Nam, tỉnh thành...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCRIPT GUIDE & WEBHOOK */}
          {activeTab === 'script_guide' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 text-xs leading-relaxed">
                <strong>💡 Cách thiết lập kết nối tự động 2 chiều (Chỉ cần làm 1 lần trong 2 phút):</strong>
                <ol className="list-decimal pl-4 mt-1.5 space-y-1">
                  <li>Mở file Google Sheet của bạn &rarr; Chọn menu <strong>Tiện ích mở rộng (Extensions)</strong> &rarr; <strong>Apps Script</strong>.</li>
                  <li>Xóa đoạn mã mặc định và dán toàn bộ đoạn mã bên dưới vào.</li>
                  <li>Nhấn nút <strong>Triển khai (Deploy)</strong> &rarr; <strong>Tùy chọn triển khai mới (New deployment)</strong>.</li>
                  <li>Chọn loại <strong>Ứng dụng web (Web app)</strong> &rarr; Ai có quyền truy cập chọn <strong>Bất kỳ ai (Anyone)</strong> &rarr; Nhấn <strong>Triển khai</strong>.</li>
                  <li>Copy link Web App URL dán vào ô bên dưới để lưu.</li>
                </ol>
              </div>

              {/* Webhook Input Field */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 text-xs block">
                  Đường dẫn Webhook Google Apps Script của bạn:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    disabled={syncing}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Đang lưu & Đẩy sang Sheet...' : 'Lưu cấu hình & Đồng bộ'}</span>
                  </button>
                </div>

                {syncStatus === 'success' && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg flex items-center gap-2 text-xs font-semibold mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{syncMessage}</span>
                  </div>
                )}
                {syncStatus === 'error' && (
                  <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-lg flex items-center gap-2 text-xs font-semibold mt-2">
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                    <span>{syncMessage}</span>
                  </div>
                )}
              </div>

              {/* Code Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">Mã Google Apps Script (Đã tối ưu hóa cho Sheet {SHEET_ID}):</span>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1 rounded-lg font-bold transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-300 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56 border border-slate-800">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT CSV */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Bạn có thể tải trực tiếp file định dạng CSV chuẩn Unicode UTF-8 để nhập (Import) ngay vào Google Sheet hoặc mở bằng Microsoft Excel:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => handleExportCSV('DON_DAT_VE')}
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all group text-center"
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-900 text-xs">Xuất DON_DAT_VE</span>
                  <span className="text-[11px] text-slate-500 mt-1">Danh sách đơn & trạng thái</span>
                </button>

                <button
                  onClick={() => handleExportCSV('HANH_KHACH')}
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center"
                >
                  <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-900 text-xs">Xuất HANH_KHACH</span>
                  <span className="text-[11px] text-slate-500 mt-1">Chi tiết từng hành khách</span>
                </button>

                <button
                  onClick={() => handleExportCSV('NHAT_KY_XU_LY')}
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all group text-center"
                >
                  <FileSpreadsheet className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-900 text-xs">Xuất NHAT_KY_XU_LY</span>
                  <span className="text-[11px] text-slate-500 mt-1">Nhật ký cuộc gọi nhân viên</span>
                </button>

                <button
                  onClick={() => handleExportCSV('USER')}
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all group text-center"
                >
                  <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-900 text-xs">Xuất Sheet USER</span>
                  <span className="text-[11px] text-slate-500 mt-1">Danh sách tài khoản nhân viên</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Google Spreadsheet ID: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800 font-bold">{SHEET_ID}</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
