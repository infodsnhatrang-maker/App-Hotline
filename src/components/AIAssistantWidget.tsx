import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, Loader2, Train, HelpCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export const AIAssistantWidget: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là Trợ lý AI Tư vấn Vé Tàu - CN VTĐS Nha Trang. Bạn cần tìm hiểu thông tin gì về loại ghế (Ngồi mềm lạnh, Giường nằm cứng, Giường nằm mềm), chính sách giảm giá cho trẻ em/sinh viên/người cao tuổi, hay thủ tục đổi trả vé?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: data.reply || 'Xin lỗi, có lỗi xảy ra.' }
      ]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Hệ thống tư vấn đang bận. Vui lòng thử lại sau.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[650px]">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-4 flex items-center justify-between border-b border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5">
              TRỢ LÝ AI - CN VTĐS NHA TRANG
              <span className="bg-indigo-700 text-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500">
                Gemini AI
              </span>
            </h3>
            <p className="text-xs text-indigo-200">Hỏi đáp quy định vé, thời gian tàu chạy, chính sách hành lý 24/7</p>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="bg-indigo-50/50 p-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="font-semibold text-indigo-900 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Gợi ý câu hỏi:
        </span>
        <button
          onClick={() => handleSend('Khác biệt giữa giường nằm cứng khoang 6 và giường mềm khoang 4?')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 whitespace-nowrap transition-colors"
        >
          Khác biệt giữa khoang 6 & khoang 4?
        </button>
        <button
          onClick={() => handleSend('Chính sách giảm giá vé cho trẻ em và người cao tuổi thế nào?')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 whitespace-nowrap transition-colors"
        >
          Chính sách giảm giá cho trẻ em?
        </button>
        <button
          onClick={() => handleSend('Quy định mang hành lý lên tàu đường sắt Việt Nam?')}
          className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 whitespace-nowrap transition-colors"
        >
          Quy định hành lý mang theo?
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-indigo-600 text-white shadow-md'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Trợ lý AI đang suy nghĩ...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Nhập câu hỏi về vé tàu, lịch trình, quy định..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white p-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
