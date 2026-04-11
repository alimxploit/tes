// api/test-key.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { type, password, apiKey } = req.body;
  
  if (password !== 'xiolimadmin123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API Key diperlukan' });
  }
  
  // Test OpenRouter API
  if (type === 'openrouter') {
    try {
      const testRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://wormgpt.vercel.app"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: "Balas dengan OK" }],
          max_tokens: 10
        })
      });
      
      const data = await testRes.json();
      if (data.choices && data.choices[0]) {
        return res.status(200).json({ valid: true, message: "OpenRouter API key VALID!" });
      } else {
        return res.status(200).json({ valid: false, error: data.error?.message || "Invalid key" });
      }
    } catch(e) {
      return res.status(200).json({ valid: false, error: e.message });
    }
  }
  
  return res.status(400).json({ error: 'Type tidak dikenal' });
}
