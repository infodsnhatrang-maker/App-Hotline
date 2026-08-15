import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { AppUser } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập (user) và mật khẩu (Password)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('railway_admin_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Tên đăng nhập (user) hoặc mật khẩu (Password) không đúng');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 px-3">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
        
        {/* Card Header */}
        <div className="bg-gradient-to-br from-slate-900 via-amber-950 to-blue-950 p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <span className="text-[11px] font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
            HỆ THỐNG NỘI BỘ
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2">
            Đăng Nhập Quản Trị & Hotline
          </h2>
          <p className="text-xs text-amber-200/80 mt-1">
            Xác thực theo danh sách tài khoản trang tính Google Sheet (Sheet ID: 514187060)
          </p>
        </div>

        {/* Card Body Form */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input (Column 'user') */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Tên Đăng Nhập (Cột `user`):</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập user (ví dụ: Admin, ngotdan...)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input (Column 'Password') */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Mật Khẩu (Cột `Password`):</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập Password..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>Đang kiểm tra bảo mật...</span>
              ) : (
                <>
                  <span>ĐĂNG NHẬP VÀO QUẢN TRỊ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Xác thực khớp cột <strong>user</strong> và <strong>Password</strong> từ trang tính Google Sheet.</span>
          </div>

        </div>
      </div>
    </div>
  );
};
