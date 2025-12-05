import { useState, useRef, useEffect } from "react";

// Konfigurasi untuk Gemini API
const GEMINI_API_KEY = ""; // Kunci API dikelola oleh lingkungan canvas
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

const CONFIG = {
  apiUrl: "https://aichat.verdoank.workers.dev/",
  title: "AI ChatGPT",
  primaryColor: "#0084ff", // Warna utama
  welcomeMessage: "Ada pertanyaan? Saya punya jawabannya",
  watermarkText: "Powered by VERDOANKS",
  watermarkLink: "https://github.com/verdoanks",
  brandingId: "VERDOANK_CHAT_V1",
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "system", content: `You are ${CONFIG.title}, a helpful and friendly AI assistant speaking Indonesian. Always reply in Indonesian.` },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isLoading]);

  // Focus input saat dibuka
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Formatter pesan (HTML & Code Block)
  const formatMessage = (text) => {
    let content = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    
    // Simple code block detection for formatting
    if (content.includes("```")) {
      content = content.replace(/```([\s\S]*?)```/g, (match, code) => 
        // Menggunakan padding p-3 dan text-sm untuk tampilan yang lebih rapi
        `<pre class="bg-gray-800 text-white p-3 rounded-lg text-sm overflow-x-auto my-2 font-mono">${code.trim()}</pre>`
      );
    }
    return { __html: content };
  };

  // --- LOGIKA GEMINI API ---
  const callGeminiApi = async (prompt) => {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      if (retryCount > 0) await new Promise(resolve => setTimeout(resolve, delay));

      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          return text || "Gagal mendapatkan respons dari Gemini.";
        } else {
          // Hanya log status error dan lanjutkan ke retry
          console.error(`Gemini API call failed with status: ${response.status}`);
          retryCount++;
        }
      } catch (error) {
        // Hanya log error koneksi dan lanjutkan ke retry
        console.error("Gemini API fetch error:", error);
        retryCount++;
      }
    }
    return "Maaf, terjadi masalah koneksi ke layanan AI.";
  };

  const handleGeminiFeature = async (feature) => {
    if (!inputValue.trim() || isLoading) return;
    setIsLoading(true);

    const textToProcess = inputValue.trim();
    let prompt = "";

    if (feature === 'summarize') {
      prompt = `Ringkas teks berikut dalam satu paragraf yang singkat dan padat dalam bahasa Indonesia: "${textToProcess}"`;
    } else if (feature === 'grammar') {
      prompt = `Perbaiki tata bahasa, ejaan, dan struktur kalimat dari teks bahasa Indonesia berikut agar menjadi formal dan sempurna: "${textToProcess}"`;
    }

    const processedText = await callGeminiApi(prompt);
    
    // Ganti inputValue dengan teks yang diproses oleh Gemini
    setInputValue(processedText);
    setIsLoading(false);
  };
  // --- END LOGIKA GEMINI API ---

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userText = inputValue.trim();
    
    // Tambahkan pesan pengguna
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setInputValue("");
    setIsLoading(true);

    // Kumpulkan riwayat pesan (termasuk pesan sistem)
    const chatHistory = [...messages, { role: "user", content: userText }];
    
    const payload = {
      messages: chatHistory,
      brandingId: CONFIG.brandingId,
      watermarkText: CONFIG.watermarkText,
      watermarkLink: CONFIG.watermarkLink,
    };

    try {
      const res = await fetch(CONFIG.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("API Error Response Status:", res.status);
        throw new Error(`Gagal terhubung ke server. Status: ${res.status}`);
      }

      const data = await res.json();
      
      let reply;
      if (data && typeof data.response === 'string') {
        reply = data.response;
      } else if (data && data.result && typeof data.result.response === 'string') {
        reply = data.result.response;
      } else {
        console.error("Unexpected API response structure:", data);
        reply = "Maaf, respons dari AI tidak terduga atau kosong.";
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      console.error("Fetch/Connection Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi gangguan koneksi atau kesalahan saat memproses data. Silakan coba lagi." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-4 font-sans antialiased">
      
      {/* --- BOX CHAT --- */}
      <div 
        className={`
          bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden flex flex-col
          transition-all duration-300 ease-out origin-bottom-right
          w-[380px] h-[550px]
          max-sm:fixed max-sm:bottom-0 max-sm:right-0 max-sm:w-full max-sm:h-[100dvh] max-sm:rounded-none
          ${isOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-90 translate-y-10 pointer-events-none hidden"}
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
          <span className="font-bold text-gray-800">{CONFIG.title}</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
          <div className="bg-white border border-gray-200 self-start p-3 rounded-xl rounded-bl-sm text-sm text-gray-700 shadow-sm max-w-[85%]">
            {CONFIG.welcomeMessage}
          </div>

          {messages.map((msg, i) => {
            if (msg.role === "system") return null;
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                className={`p-3 rounded-xl text-sm max-w-[85%] shadow-sm break-words ${
                  isUser 
                    ? "text-white self-end rounded-br-sm" 
                    : "bg-white border border-gray-200 text-gray-700 self-start rounded-bl-sm"
                }`}
                style={isUser ? { backgroundColor: CONFIG.primaryColor } : {}}
                dangerouslySetInnerHTML={formatMessage(msg.content)}
              />
            );
          })}
          
          {isLoading && (
            <div className="self-start text-xs text-gray-500 animate-pulse pl-2">Sedang mengetik...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area dengan Fitur Gemini */}
        <div className="p-3 border-t border-gray-100 bg-white max-sm:pb-6">
          <div className="relative flex items-center">
            {/* Input Field: Padding kanan ditambah untuk menampung 2 tombol baru */}
            <input
              ref={inputRef}
              type="text"
              className="flex-1 px-4 py-4 pr-32 border border-gray-300 rounded-full text-sm focus:outline-none transition disabled:bg-gray-100 h-14" 
              placeholder="Ketik pesan..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            
            {/* Tombol-tombol Gemini API dan Kirim */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex space-x-1">
              {/* Tombol Koreksi Tata Bahasa */}
              <button
                onClick={() => handleGeminiFeature('grammar')}
                disabled={isLoading || !inputValue.trim()}
                title="Koreksi Tata Bahasa (Gemini)"
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span role="img" aria-label="Koreksi">✨</span>
              </button>

              {/* Tombol Ringkas Pesan */}
              <button
                onClick={() => handleGeminiFeature('summarize')}
                disabled={isLoading || !inputValue.trim()}
                title="Ringkas Pesan (Gemini)"
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 17v-1h-3v-3h-2v3h-3v1h3v3h2v-3h3zm5.71-12.71l-1.42-1.42L12 10.59 5.71 4.29 4.29 5.71 10.59 12l-6.3 6.3 1.42 1.42L12 13.41l6.3 6.3 1.42-1.42L13.41 12l6.3-6.3z"/>
                </svg>
              </button>

              {/* Tombol Kirim */}
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md hover:opacity-90 active:scale-95 transition disabled:bg-gray-300 disabled:cursor-not-allowed" 
                style={{ backgroundColor: CONFIG.primaryColor }}
              >
                <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Watermark */}
        <div className="text-center text-[10px] py-1 text-gray-400 border-t border-gray-100 bg-white">
          <a href={CONFIG.watermarkLink} target="_blank" className="hover:text-blue-500 transition font-medium">
            {CONFIG.watermarkText}
          </a>
        </div>
      </div>

      {/* --- FAB BUTTON --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center 
          transition-transform duration-300 hover:scale-110 active:scale-95
          ${isOpen ? "max-sm:hidden" : ""}
        `}
        style={{ backgroundColor: CONFIG.primaryColor }}
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </button>

    </div>
  );
    }
