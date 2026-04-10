// api/admin.js
const ADMIN_PASS = "xiolimadmin123";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, password, name, code } = req.body;
  
  if (password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Password admin salah' });
  }
  
  // Generate kode baru
  if (action === 'generate') {
    if (!name) return res.status(400).json({ error: 'Nama diperlukan' });
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    const seg = () => {
      let s = '';
      for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    };
    const newCode = `${seg()}-${seg()}-${seg()}-${seg()}`;
    
    // Panggil API activate.js untuk menyimpan (simplifikasi)
    // Di production, pake database
    
    return res.status(200).json({
      success: true,
      code: newCode,
      name: name
    });
  }
  
  // Test API DeepSeek
  if (action === 'test-deepseek') {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API Key diperlukan' });
    
    try {
      const testRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Halo" }],
          max_tokens: 10
        })
      });
      const data = await testRes.json();
      if (data.choices && data.choices[0]) {
        return res.status(200).json({ valid: true, message: "DeepSeek API key VALID!" });
      } else {
        return res.status(200).json({ valid: false, error: data.error?.message || "Invalid key" });
      }
    } catch(e) {
      return res.status(200).json({ valid: false, error: e.message });
    }
  }
  
  // Test API Gemini
  if (action === 'test-gemini') {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API Key diperlukan' });
    
    try {
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Halo" }] }]
        })
      });
      const data = await testRes.json();
      if (data.candidates && data.candidates[0]) {
        return res.status(200).json({ valid: true, message: "Gemini API key VALID!" });
      } else {
        return res.status(200).json({ valid: false, error: data.error?.message || "Invalid key" });
      }
    } catch(e) {
      return res.status(200).json({ valid: false, error: e.message });
    }
  }
  
  return res.status(400).json({ error: 'Action tidak dikenal' });
}
