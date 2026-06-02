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

    // --- Settings Modal Elements ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const tempInput = document.getElementById('azure-temp');
    const tempVal = document.getElementById('temp-val');
    const toggleKeyVisibility = document.getElementById('toggle-key-visibility');
    
    // --- Inputs for connection settings ---
    const endpointInput = document.getElementById('azure-endpoint');
    const keyInput = document.getElementById('azure-key');
    const deploymentInput = document.getElementById('azure-deployment');
    const instructionsInput = document.getElementById('azure-instructions');

    // --- State ---
    let isTyping = false;
    let currentThreadId = null; // Azure thread for conversation continuity
    let config = {
        endpoint: '',
        key: '',
        deployment: '',
        temperature: 0.7,
        instructions: ''
    };

    // --- Load saved configurations ---
    function loadConfig() {
        const saved = localStorage.getItem('agente_az106_config');
        if (saved) {
            config = JSON.parse(saved);
            endpointInput.value = config.endpoint || '';
            keyInput.value = config.key || '';
            deploymentInput.value = config.deployment || '';
            tempInput.value = config.temperature !== undefined ? config.temperature : 0.7;
            tempVal.textContent = tempInput.value;
            instructionsInput.value = config.instructions || '';
            updateSetupIndicator();
        }
    }

    // --- Update setup visual indicator ---
    function updateSetupIndicator() {
        setupIndicator.className = 'setup-badge connected';
        setupIndicator.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Conectado ao Agente Azure (Agnovochat)</span>
        `;
    }

    // --- Save configuration ---
    function saveConfig() {
        config = {
            endpoint: endpointInput.value.trim(),
            key: keyInput.value.trim(),
            deployment: deploymentInput.value.trim(),
            temperature: parseFloat(tempInput.value),
            instructions: instructionsInput.value.trim()
        };
        localStorage.setItem('agente_az106_config', JSON.stringify(config));
        updateSetupIndicator();
        closeModal();
    }

    // --- Modal Functions ---
    function openModal() {
        settingsModal.classList.add('active');
        settingsModal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        settingsModal.classList.remove('active');
        settingsModal.setAttribute('aria-hidden', 'true');
    }

    // --- Event Listeners for Modal ---
    settingsBtn.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    modalSaveBtn.addEventListener('click', saveConfig);

    // Close on click outside modal
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeModal();
        }
    });

    // Handle range display
    tempInput.addEventListener('input', () => {
        tempVal.textContent = tempInput.value;
    });

    // Toggle Key visibility
    toggleKeyVisibility.addEventListener('click', () => {
        const type = keyInput.type === 'password' ? 'text' : 'password';
        keyInput.type = type;
        const icon = toggleKeyVisibility.querySelector('svg');
        if (type === 'text') {
            icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
        } else {
            icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
        }
    });

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
            // Call the serverless API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    threadId: currentThreadId
                })
            });

            const data = await response.json();

            hideTyping();

            if (response.ok) {
                // Store thread ID for conversation continuity
                if (data.threadId) {
                    currentThreadId = data.threadId;
                }
                addMessage(data.response, 'bot');
            } else {
                addMessage(`⚠️ Erro: ${data.error || 'Falha ao comunicar com o agente.'}`, 'bot');
            }
        } catch (error) {
            hideTyping();
            addMessage('⚠️ Erro de conexão. Verifique se o servidor está respondendo.', 'bot');
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
    loadConfig();

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
