/* ============================================
   AgenteAz106 - Azure AI Agent Proxy
   Vercel Serverless Function
   ============================================ */

const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AGENT_ID = process.env.AZURE_AGENT_ID || "Agnovochat";
const API_VERSION = "2025-05-15-preview";

const headers = {
    "api-key": AZURE_API_KEY,
    "Content-Type": "application/json"
};

async function azureFetch(path, options = {}) {
    const url = `${AZURE_ENDPOINT}${path}?api-version=${API_VERSION}`;
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

        // 3. Create a run with the agent
        const run = await azureFetch(`/threads/${currentThreadId}/runs`, {
            method: "POST",
            body: JSON.stringify({
                agent_id: AGENT_ID
            })
        });

        // 4. Poll for run completion (max 60 seconds)
        let runStatus = run;
        let attempts = 0;
        const maxAttempts = 60;

        while (runStatus.status === "queued" || runStatus.status === "in_progress") {
            if (attempts >= maxAttempts) {
                throw new Error("Agent response timed out after 60 seconds");
            }
            await sleep(1000);
            runStatus = await azureFetch(`/threads/${currentThreadId}/runs/${run.id}`, {
                method: "GET"
            });
            attempts++;
        }

        if (runStatus.status === "failed") {
            throw new Error(`Agent run failed: ${JSON.stringify(runStatus.last_error || "Unknown error")}`);
        }

        // 5. Get the latest assistant message
        const messages = await azureFetch(`/threads/${currentThreadId}/messages`, {
            method: "GET"
        });

        // Find the most recent assistant message
        const assistantMessages = messages.data.filter(m => m.role === "assistant");
        const latestMessage = assistantMessages[0];

        let responseText = "Sem resposta do agente.";
        if (latestMessage && latestMessage.content && latestMessage.content.length > 0) {
            // Extract text from content array
            const textContent = latestMessage.content.find(c => c.type === "text");
            if (textContent) {
                responseText = textContent.text.value || textContent.text;
            }
        }

        return res.status(200).json({
            response: responseText,
            threadId: currentThreadId,
            agentId: AGENT_ID,
            status: runStatus.status
        });

    } catch (error) {
        console.error("Azure Agent Error:", error);
        return res.status(500).json({
            error: "Erro ao comunicar com o agente Azure",
            details: error.message
        });
    }
}
