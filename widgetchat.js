(function() {
    // --- KONFIGURASI PENTING ---
    const CONFIG = {
        apiUrl: "https://chat.verdoank.workers.dev/", 
        title: "Verdoank AI Chat", 
        primaryColor: "#0084ff",
        welcomeMessage: "Ada pertanyaan? Saya punya jawabannya",
        watermarkText: "Powered by VERDOANK",
        watermarkLink: "#"
    };
    
    // --- 1. INJECT CSS (PERBAIKAN HOVER TOMBOL KIRIM) ---
    const style = document.createElement('style');
    style.innerHTML = `
        /* PENTING: Semua selector kini dimulai dari #v-widget-container untuk isolasi */
        #v-widget-container { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            position: fixed;
            bottom: 0;
            right: 0;
            z-index: 99999;
            pointer-events: none;
        }
        
        /* FAB Button */
        #v-fab {
            position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
            background-color: ${CONFIG.primaryColor}; border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
            cursor: pointer;
            z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.3s;
            pointer-events: auto;
        }
        #v-fab:hover { transform: scale(1.1); }
        #v-fab svg { width: 30px; height: 30px; fill: white; }
        
        /* Chat Box */
        #v-box {
            position: fixed; bottom: 90px; right: 20px;
            width: 380px; height: 550px; background: #fff;
            border-radius: 16px; box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 99999; flex-direction: column; overflow: hidden;
            border: 1px solid #e0e0e0;
            display: flex;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s ease-out;
        }

        /* State Terbuka */
        #v-box.v-opened {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1) translateY(0);
        }
        
        /* CSS INTERNAL BOX */
        .v-header { background: #ffffff; color: #050505; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; border-bottom: 1px solid #eee; }
        
        /* Tombol Tutup Header */
        .v-close { 
            cursor: pointer;
            font-size: 1.2rem;
            background: none;
            border: none;
            color: #333; /* Warna simbol X */
            padding: 0;
            width: 30px; 
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }
        .v-close:hover {
            background-color: #f0f0f0; 
        }
        
        #v-messages { flex: 1; padding: 15px; overflow-y: auto; background: #f9f9f9; display: flex; flex-direction: column; gap: 10px; }
        .v-msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; line-height: 1.4; word-wrap: break-word; }
        .v-msg.ai { background: white; align-self: flex-start; border: 1px solid #ddd; color: #333; border-bottom-left-radius: 2px; }
        .v-msg.user { background: ${CONFIG.primaryColor}; align-self: flex-end; color: white; border-bottom-right-radius: 2px; }
        
        /* Area Input */
        .v-input-area { padding: 10px; border-top: 1px solid #eee; background: white; display: flex; align-items: center; gap: 8px; }
        .v-input-area input { 
            flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; 
            cursor: text;
        }
        .v-input-area input:disabled { background: #eee; cursor: not-allowed; }
        
        /* Tombol Kirim */
        #v-send-btn { 
            background: ${CONFIG.primaryColor}; 
            border: none; 
            cursor: pointer;
            width: 40px; 
            height: 40px;
            border-radius: 50%;
            display: flex; 
            align-items: center; 
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s; /* <--- PERBAIKAN: Ubah transisi ke 'all' */
        }
        /* <--- PERBAIKAN: Efek Hover/Active untuk kesan lingkaran */
        #v-send-btn:hover {
            opacity: 0.9;
            transform: scale(1.05);
        }
        #v-send-btn:active {
            transform: scale(0.9);
        }
        /* End PERBAIKAN */
        #v-send-btn svg { width: 20px; height: 20px; fill: white; margin-left: 2px; }
        
        pre { background: #2d2d2d; color: #fff; padding: 8px; border-radius: 6px; overflow-x: auto; margin: 5px 0; font-size: 0.8rem; }

        /* WATERMARK */
        #v-wm { text-align: center; font-size: 11px; padding: 4px; background: white; color: #888; border-top: 1px solid #eee; }
        #v-wm a { 
            text-decoration: none; color: #888; font-weight: bold; transition: color 0.2s;
            cursor: pointer; 
        }
        #v-wm a:hover { color: ${CONFIG.primaryColor}; }

        /* --- MEDIA QUERY: PERBAIKAN MOBILE KRUSIAL --- */
        @media (max-width: 480px) {
            #v-box { 
                width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0; 
                transform: translateX(100%);
            }
            #v-box.v-opened {
                transform: translateX(0);
                opacity: 1;
            }
            
            /* SOLUSI OVERLAP: SEMBUNYIKAN FAB KETIKA BOX TERBUKA */
            #v-box.v-opened ~ #v-fab {
                 display: none !important; 
                 pointer-events: none;
            }

            /* Pastikan FAB muncul hanya ketika BOX tertutup */
            #v-fab {
                display: flex;
            }

            /* Atur padding input area agar aman di mobile */
            .v-input-area {
                 padding-bottom: max(10px, env(safe-area-inset-bottom));
            }
        }
    `;
    document.head.appendChild(style);

    // --- 2. INJECT HTML (TIDAK BERUBAH) ---
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'v-widget-container';
    widgetContainer.innerHTML = `
        <div id="v-box">
            <div class="v-header">
                <span>${CONFIG.title}</span>
                <button class="v-close">✕</button>
            </div>
            <div id="v-messages">
                <div class="v-msg ai">${CONFIG.welcomeMessage}</div>
            </div>
            <div class="v-input-area">
                <input type="text" id="v-input" placeholder="Ketik pesan..." autocomplete="off">
                <button class="v-btn" id="v-send-btn">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
            </div>
            
            <div id="v-wm">
                <a href="${CONFIG.watermarkLink}" target="_blank">${CONFIG.watermarkText}</a>
            </div>
        </div>
        
        <div id="v-fab">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
        </div>
    `;
    document.body.appendChild(widgetContainer);

    // --- 3. LOGIC (TIDAK BERUBAH) ---
    let messagesHistory = [{ 
        role: "system", 
        content: `You are ${CONFIG.title}, a helpful and friendly AI assistant speaking Indonesian. Always reply in Indonesian.` 
    }];
    let isChatOpen = false;
    
    // DOM Elements
    const fab = document.getElementById('v-fab');
    const box = document.getElementById('v-box');
    const closeBtn = document.querySelector('.v-close');
    const messagesDiv = document.getElementById('v-messages');
    const input = document.getElementById('v-input');
    const sendBtn = document.getElementById('v-send-btn');
    
    // --- FUNGSIONALITAS DASAR CHAT ---

    function toggleChat() {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            box.classList.add('v-opened');
            input.focus(); 
            scrollToBottom(); 
        } else {
            box.classList.remove('v-opened');
        }
    }

    fab.onclick = toggleChat;
    closeBtn.onclick = toggleChat;
    
    function scrollToBottom() { messagesDiv.scrollTop = messagesDiv.scrollHeight; }

    function appendMessage(role, text) { 
        const div = document.createElement('div');
        div.className = `v-msg ${role}`;
        let content = text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                           .replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        if (content.includes("```")) content = content.replace(/```([\s\S]*?)```/g, (match, code) => `<pre>${code.trim()}</pre>`);
        div.innerHTML = content;
        messagesDiv.appendChild(div);
        scrollToBottom();
    }

    async function sendMessage() {
        if (input.disabled) {
             return;
        }

        const text = input.value.trim();
        if (!text) return; 

        appendMessage('user', text); 
        
        input.value = '';
        messagesHistory.push({ role: "user", content: text }); 
        input.disabled = true;
        sendBtn.disabled = true;

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'v-msg ai';
        loadingDiv.id = 'v-loading';
        loadingDiv.innerHTML = 'Sedang mengetik...';
        messagesDiv.appendChild(loadingDiv);
        scrollToBottom();

        try {
            const res = await fetch(CONFIG.apiUrl, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: messagesHistory })
            });
            
            if (!res.ok) {
                 const errorData = await res.json().catch(() => ({ error: `Server Error: Status ${res.status}` }));
                 if(document.getElementById('v-loading')) document.getElementById('v-loading').remove();
                 appendMessage('ai', `Gangguan Server: ${errorData.error || `Status ${res.status}`}`);
                 messagesHistory.pop();
                 return;
            }

            const data = await res.json();
            let reply = "";
            if (data.response && typeof data.response === 'string') reply = data.response;
            else if (data.result && data.result.response) reply = data.result.response;
            else reply = JSON.stringify(data);
            
            if(document.getElementById('v-loading')) document.getElementById('v-loading').remove();
            appendMessage('ai', reply);
            messagesHistory.push({ role: "assistant", content: reply });
        } catch (e) {
            if(document.getElementById('v-loading')) document.getElementById('v-loading').remove();
            appendMessage('ai', "Gangguan koneksi/jaringan.");
            messagesHistory.pop();
        } finally {
             input.disabled = false;
             sendBtn.disabled = false;
             input.focus();
        }
    }

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
})();
