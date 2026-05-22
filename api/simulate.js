export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action } = req.body;
    if (!action) {
        return res.status(400).json({ error: 'Action parameter is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
    }

    const targetUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Completely redesigned prompt for better advice, natural "you" phrasing, and detailed outcomes
    const promptText = `The user is planning or thinking about this situation: "${action}".
    Act as a wise, blunt, and realistic advisor. Talk directly to the user using "You" or "Your" (e.g., "You can tell her...", "Your approach should be...").
    
    Provide a response broken down into exactly these parts:
    1. A short, reasonable, and helpful advice paragraph explaining what you can actually do right now.
    2. A list of 4 to 5 detailed, realistic outcomes of what could happen next based on your action. Each outcome should be a full, detailed sentence, not just a few words.
    
    CRITICAL FORMAT RULES:
    - Do NOT use markdown bold wrappers like **Advice** or **Outcomes**.
    - Do NOT use markdown headers or backticks (\`\`\`).
    - Just make the first line your advice paragraph.
    - Put a blank line after the advice paragraph.
    - Then list the outcomes line by line, with each item starting with a number (e.g., "1. First detailed outcome...").
    - Keep it clean, direct, and conversational.`;

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const rawResponseText = data.candidates[0].content.parts[0].text.trim();
        
        // Split text block cleanly by newlines into an array for the frontend to display
        const lines = rawResponseText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        return res.status(200).json({ outcomes: lines });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
