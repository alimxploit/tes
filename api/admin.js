// api/admin.js
const ADMIN_PASS = "xiolimadmin123";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, password, name, max_credit, days, apiKey } = req.body;
  
  if (password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Password admin salah' });
  }
  
  // ========== GENERATE KODE AKTIVASI ==========
  if (action === 'generate') {
    if (!name) return res.status(400).json({ error: 'Nama diperlukan' });
    
    const credit = parseInt(max_credit) || 1000;
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    const seg = () => {
      let s = '';
      for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    };
    const newCode = `${seg()}-${seg()}-${seg()}-${seg()}`;
    
    let expiry_date = null;
    if (days && days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(days));
      expiry_date = date.toISOString().split('T')[0];
    }
    
    // Simpan ke activate.js (panggil API internal)
    try {
      const API_BASE = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      await fetch(`${API_BASE}/api/activate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASS, name, max_credit: credit, days })
      });
    } catch(e) {
      console.log("Save error:", e);
    }
    
    return res.status(200).json({
      success: true,
      code: newCode,
      name: name,
      max_credit: credit,
      expiry_date: expiry_date || 'forever'
    });
  }
  
  // ========== TEST DEEPSEEK API ==========
  if (action === 'test-deepseek') {
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
  
  // ========== TEST GEMINI API 2.5 FLASH ==========
  if (action === 'test-gemini') {
    if (!apiKey) return res.status(400).json({ error: 'API Key diperlukan' });
    
    try {
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Halo, balas dengan 'OK'" }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        }),
      });
      
      const data = await testRes.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return res.status(200).json({ 
          valid: true, 
          message: "Gemini API key VALID! (gemini-2.5-flash)"
        });
      } else if (data.error) {
        return res.status(200).json({ valid: false, error: data.error.message });
      } else {
        return res.status(200).json({ valid: false, error: "Invalid response from Gemini" });
      }
    } catch(e) {
      return res.status(200).json({ valid: false, error: e.message });
    }
  }
  
  return res.status(400).json({ error: 'Action tidak dikenal' });
}
