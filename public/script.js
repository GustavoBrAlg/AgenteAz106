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

    // --- State ---
    let isTyping = false;

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
    function sendMessage(text) {
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

        // Simulate bot response
        setTimeout(() => {
            hideTyping();
            const response = generateResponse(text);
            addMessage(response, 'bot');
        }, 1200 + Math.random() * 1000);
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

    // --- Generate Response (Demo) ---
    function generateResponse(input) {
        const lower = input.toLowerCase();

        const responses = {
            'o que você pode fazer': 
                'Sou o AgenteAz106, um assistente virtual powered by Azure AI! Posso ajudar com:\n\n' +
                '• Responder perguntas sobre diversos assuntos\n' +
                '• Auxiliar em projetos de desenvolvimento\n' +
                '• Explicar conceitos técnicos\n' +
                '• Fornecer informações e sugestões\n\n' +
                'Como posso ajudar você hoje?',

            'me ajude com um projeto':
                'Claro! Ficarei feliz em ajudar com seu projeto. Para começar, me conte:\n\n' +
                '• Qual é o objetivo do projeto?\n' +
                '• Quais tecnologias está utilizando?\n' +
                '• Em qual etapa você está?\n\n' +
                'Com essas informações, posso fornecer orientações mais específicas!',

            'explique um conceito técnico':
                'Com prazer! Posso explicar conceitos de diversas áreas:\n\n' +
                '• Programação (Python, JavaScript, C#, etc.)\n' +
                '• Cloud Computing (Azure, AWS, GCP)\n' +
                '• Inteligência Artificial e Machine Learning\n' +
                '• DevOps e infraestrutura\n' +
                '• Banco de dados e arquitetura de software\n\n' +
                'Qual conceito você gostaria de entender melhor?',
        };

        // Check for matching suggestion
        for (const [key, value] of Object.entries(responses)) {
            if (lower.includes(key.toLowerCase())) {
                return value;
            }
        }

        // Default contextual responses
        if (lower.includes('olá') || lower.includes('oi') || lower.includes('hey') || lower.includes('bom dia') || lower.includes('boa tarde') || lower.includes('boa noite')) {
            return 'Olá! 👋 Que bom ter você aqui! Sou o AgenteAz106, seu assistente virtual. Como posso ajudar?';
        }

        if (lower.includes('obrigad')) {
            return 'De nada! 😊 Fico feliz em poder ajudar. Se tiver mais alguma dúvida, é só perguntar!';
        }

        if (lower.includes('azure')) {
            return 'O Azure é a plataforma de cloud computing da Microsoft, oferecendo serviços como:\n\n' +
                '• Azure AI Services para inteligência artificial\n' +
                '• Azure App Service para hospedagem de aplicações\n' +
                '• Azure Functions para computação serverless\n' +
                '• Azure Cosmos DB para bancos de dados globais\n\n' +
                'Este próprio agente é powered by Azure AI! Quer saber mais sobre algum serviço específico?';
        }

        // Generic response
        const genericResponses = [
            `Entendi sua pergunta sobre "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}". Este é um demo do AgenteAz106. Na versão completa, estarei conectado ao Azure AI para fornecer respostas mais detalhadas e precisas!`,
            `Boa pergunta! No momento estou em modo demonstração. Quando conectado ao Azure AI, poderei fornecer uma resposta completa sobre esse assunto. Quer saber mais sobre como configurar a integração?`,
            `Obrigado pela sua mensagem! Este é o modo de demonstração do AgenteAz106. A versão com Azure AI integrado terá capacidades avançadas de processamento de linguagem natural para responder perguntas como essa.`,
        ];

        return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }

    // --- Feature card animations (intersection observer) ---
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
