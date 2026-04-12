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
  
  if (type === 'gemini') {
    try {
      // PAKE GEMINI 2.5 FLASH
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Balas dengan 'OK'" }] }]
        }),
      });
      
      const data = await testRes.json();
      
      if (data.candidates && data.candidates[0]) {
        return res.status(200).json({ valid: true, message: "Gemini API key VALID! (gemini-2.5-flash)" });
      } else if (data.error) {
        return res.status(200).json({ valid: false, error: data.error.message });
      } else {
        return res.status(200).json({ valid: false, error: "Invalid response" });
      }
    } catch(e) {
      return res.status(200).json({ valid: false, error: e.message });
    }
  }
  
  return res.status(400).json({ error: 'Type tidak dikenal' });
}
