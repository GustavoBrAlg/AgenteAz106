/* ============================================
   AgenteAz106 - Azure AI Agent Proxy
   Vercel Serverless Function
   ============================================ */

const AZURE_BASE = process.env.AZURE_ENDPOINT; // e.g. https://projgustavonovo-resource.services.ai.azure.com/openai
const AZURE_API_KEY = process.env.AZURE_API_KEY;
const ASSISTANT_ID = process.env.AZURE_ASSISTANT_ID; // e.g. asst_743ojDeMnBaPuSmq4LBdvtVK
const API_VERSION = "2025-03-01-preview";

const headers = {
    "api-key": AZURE_API_KEY,
    "Content-Type": "application/json"
};

async function azureFetch(path, options = {}) {
    const url = `${AZURE_BASE}${path}?api-version=${API_VERSION}`;
    const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Azure API error ${res.status}: ${errorText}`);
    }
    return res.json();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, threadId } = req.body;

    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    try {
        // 1. Create a new thread or reuse existing
        let currentThreadId = threadId;
        if (!currentThreadId) {
            const thread = await azureFetch("/threads", {
                method: "POST",
                body: JSON.stringify({})
            });
            currentThreadId = thread.id;
        }

        // 2. Add user message to thread
        await azureFetch(`/threads/${currentThreadId}/messages`, {
            method: "POST",
            body: JSON.stringify({
                role: "user",
                content: message
            })
        });

        // 3. Create a run with the assistant
        const run = await azureFetch(`/threads/${currentThreadId}/runs`, {
            method: "POST",
            body: JSON.stringify({
                assistant_id: ASSISTANT_ID
            })
        });

        // 4. Poll for run completion (max 55 seconds to stay within Vercel timeout)
        let status = run.status;
        let attempts = 0;
        const maxAttempts = 27; // 27 * 2s = 54s max

        await sleep(2000); // Initial wait

        while (status === "queued" || status === "in_progress") {
            if (attempts >= maxAttempts) {
                throw new Error("Agent response timed out");
            }
            const check = await azureFetch(`/threads/${currentThreadId}/runs/${run.id}`, {
                method: "GET"
            });
            status = check.status;
            attempts++;

            if (status === "queued" || status === "in_progress") {
                await sleep(2000);
            }
        }

        if (status === "failed" || status === "cancelled" || status === "expired") {
            throw new Error(`Agent run ended with status: ${status}`);
        }

        // 5. Get the latest assistant message
        const messages = await azureFetch(`/threads/${currentThreadId}/messages?order=desc&limit=1`, {
            method: "GET"
        });

        let responseText = "Sem resposta do agente.";
        const latestMessage = messages.data?.[0];
        if (latestMessage && latestMessage.role === "assistant" && latestMessage.content?.length > 0) {
            const textContent = latestMessage.content.find(c => c.type === "text");
            if (textContent) {
                responseText = textContent.text?.value || textContent.text || responseText;
            }
        }

        return res.status(200).json({
            response: responseText,
            threadId: currentThreadId
        });

    } catch (error) {
        console.error("Azure Agent Error:", error);
        return res.status(500).json({
            error: "Erro ao comunicar com o agente Azure",
            details: error.message
        });
    }
}
