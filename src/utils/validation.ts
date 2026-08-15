/**
 * Utility functions for validating Vietnamese Phone Numbers and Email Addresses
 */

/**
 * Kiểm tra số điện thoại Việt Nam hợp lệ
 * Hỗ trợ các đầu số di động 10 số (03x, 05x, 07x, 08x, 09x) và mã quốc gia (+84 / 84),
 * cũng như các đầu số bàn cố định Việt Nam (02x).
 */
export function validateVietnamesePhone(phone: string): { isValid: boolean; error: string; cleaned: string } {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      error: 'Vui lòng nhập số điện thoại liên hệ',
      cleaned: ''
    };
  }

  // Xóa các ký tự khoảng trắng, dấu gạch nối, dấu chấm, ngoặc đơn
  const cleaned = phone.trim().replace(/[\s().-]/g, '');

  // Kiểm tra chỉ chứa số và dấu + ở đầu
  if (!/^\+?[0-9]+$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Số điện thoại chỉ được chứa chữ số',
      cleaned
    };
  }

  // Regex chuẩn các mạng di động Việt Nam:
  // Viettel: 086, 096, 097, 098, 032, 033, 034, 035, 036, 037, 038, 039
  // Mobifone: 089, 090, 093, 070, 079, 077, 076, 078
  // Vinaphone: 088, 091, 094, 083, 084, 085, 081, 082
  // Vietnamobile: 092, 056, 058, 052
  // Gmobile: 099, 059
  // Itelecom / Wintel: 087, 055
  // Hoặc số cố định có mã vùng (02x)
  const vnMobilePattern = /^(?:(?:\+84|84|0)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7})$/;
  const vnLandlinePattern = /^(?:(?:\+84|84|0)2[0-9]{1,2}[0-9]{7,8})$/;

  if (vnMobilePattern.test(cleaned) || vnLandlinePattern.test(cleaned)) {
    return {
      isValid: true,
      error: '',
      cleaned
    };
  }

  // Phân tích lỗi cụ thể để báo người dùng
  let numberOnly = cleaned;
  if (numberOnly.startsWith('+84')) numberOnly = '0' + numberOnly.substring(3);
  else if (numberOnly.startsWith('84') && numberOnly.length > 9) numberOnly = '0' + numberOnly.substring(2);

  if (numberOnly.length < 10) {
    return {
      isValid: false,
      error: `Số điện thoại quá ngắn (${numberOnly.length} số). Vui lòng nhập đủ 10 số di động VN.`,
      cleaned
    };
  }

  if (numberOnly.length > 11) {
    return {
      isValid: false,
      error: `Số điện thoại quá dài (${numberOnly.length} số). Số di động VN gồm 10 chữ số.`,
      cleaned
    };
  }

  return {
    isValid: false,
    error: 'Đầu số không hợp lệ tại Việt Nam (hợp lệ: 03x, 05x, 07x, 08x, 09x)',
    cleaned
  };
}

/**
 * Kiểm tra định dạng Email hợp lệ theo chuẩn quốc tế RFC
 */
export function validateEmail(email: string): { isValid: boolean; error: string; cleaned: string } {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: 'Vui lòng nhập email nhận vé điện tử',
      cleaned: ''
    };
  }

  const cleaned = email.trim().toLowerCase();

  // Kiểm tra không chứa khoảng trắng
  if (/\s/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Địa chỉ email không được chứa khoảng trắng',
      cleaned
    };
  }

  // Kiểm tra có ký tự @
  if (!cleaned.includes('@')) {
    return {
      isValid: false,
      error: 'Email phải có ký tự @ (Ví dụ: name@gmail.com)',
      cleaned
    };
  }

  // Regex chuẩn kiểm tra email với tên miền và đuôi tên miền hợp lệ
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Định dạng email chưa đúng (Ví dụ: nguyenvana@gmail.com, info@tencongty.vn)',
      cleaned
    };
  }

  const parts = cleaned.split('@');
  if (parts.length !== 2 || !parts[1].includes('.')) {
    return {
      isValid: false,
      error: 'Email thiếu phần tên miền (Ví dụ: .com, .vn, .com.vn)',
      cleaned
    };
  }

  const domain = parts[1];
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      error: 'Đuôi tên miền email không hợp lệ',
      cleaned
    };
  }

  return {
    isValid: true,
    error: '',
    cleaned
  };
}
