export default async function handler(req, res) {
    // Only allow secure POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action } = req.body;
    if (!action) {
        return res.status(400).json({ error: 'Action parameter is required.' });
    }

    // Grabs your secret key from Vercel's Environment Variables panel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
    }

    const targetUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `The user wants to know the direct outcomes of this action: "${action}". 
    Provide a list of all possible human reactions, outcomes, or scenarios that could happen next. 
    CRITICAL FORMAT RULES: 
    - Each outcome must be a single, short sentence on one line. 
    - Do NOT write paragraphs, explanations, or long stories. 
    - Write it plainly and directly (e.g., "She gets angry and slaps you.", "She doesn't get angry but plays along.") 
    - Return ONLY the numbered list. No markdown headers, no backticks.`;

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
        
        // Split text block cleanly by newlines into an array
        const lines = rawResponseText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        return res.status(200).json({ outcomes: lines });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}