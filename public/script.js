/* ============================================
   AgenteAz106 - Chat Application Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const messagesArea = document.getElementById('messages-area');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const chatContainer = document.getElementById('chat-container');
    const setupIndicator = document.getElementById('setup-indicator');

    // --- State ---
    let isTyping = false;
    let currentThreadId = null; // Azure thread for conversation continuity

    // --- Navigation ---
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;

            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(`section-${targetSection}`);
            if (target) target.classList.add('active');
        });
    });

    // --- Auto-resize textarea ---
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
        sendBtn.disabled = messageInput.value.trim() === '';
    });

    // --- Send message on Enter (Shift+Enter for new line) ---
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (messageInput.value.trim()) {
                sendMessage(messageInput.value.trim());
            }
        }
    });

    // --- Send button click ---
    sendBtn.addEventListener('click', () => {
        if (messageInput.value.trim()) {
            sendMessage(messageInput.value.trim());
        }
    });

    // --- Suggestion chips ---
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            sendMessage(chip.textContent.trim());
        });
    });

    // --- Send Message ---
    async function sendMessage(text) {
        if (isTyping) return;

        // Hide welcome, show messages
        if (welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
            messagesArea.style.display = 'flex';
        }

        // Add user message
        addMessage(text, 'user');

        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Show typing indicator
        showTyping();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    threadId: currentThreadId
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Erro HTTP ${res.status}`);
            }

            const data = await res.json();
            
            if (data.threadId) {
                currentThreadId = data.threadId;
            }

            hideTyping();
            addMessage(data.response || "Sem resposta do agente.", 'bot');

        } catch (error) {
            hideTyping();
            addMessage(`⚠️ Erro: ${error.message}`, 'bot');
            console.error('Chat error:', error);
        }
    }

    // --- Add message to chat ---
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${sender}`;

        const avatarSVG = sender === 'user'
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 14L12 10L15 14"/><circle cx="12" cy="12" r="1.5"/></svg>`;

        messageDiv.innerHTML = `
            <div class="message-avatar" style="${sender === 'bot' ? 'color: var(--accent-indigo)' : ''}">
                ${avatarSVG}
            </div>
            <div class="message-bubble">${escapeHtml(text)}</div>
        `;

        messagesArea.appendChild(messageDiv);
        scrollToBottom();
    }

    // --- Typing Indicator ---
    function showTyping() {
        isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-bot';
        typingDiv.id = 'typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar" style="color: var(--accent-indigo)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 14L12 10L15 14"/><circle cx="12" cy="12" r="1.5"/></svg>
            </div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        messagesArea.appendChild(typingDiv);
        scrollToBottom();
    }

    function hideTyping() {
        isTyping = false;
        const typing = document.getElementById('typing-message');
        if (typing) typing.remove();
    }

    // --- Scroll to bottom ---
    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    // --- Escape HTML ---
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Response now handled by /api/chat (Azure Agent) ---

    // --- Init ---
    // (No frontend initialization needed anymore)

    // --- Feature card animations ---
    const featureCards = document.querySelectorAll('.feature-card');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        featureCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });
    }
});
