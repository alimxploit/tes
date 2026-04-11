// api/admin.js (cuma bagian test gemini yang diganti)
// Test Gemini API 2.5 Flash
if (action === 'test-gemini') {
    if (!apiKey) return res.status(400).json({ error: 'API Key diperlukan' });
    
    try {
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Halo" }] }]
        })
      });
      const data = await testRes.json();
      if (data.candidates && data.candidates[0]) {
        return res.status(200).json({ valid: true, message: "Gemini API key VALID! (gemini-2.5-flash)" });
      } else {
        return res.status(200).json({ valid: false, error: data.error?.message || "Invalid key" });
      }
    } catch(e) {
      return res.status(200).json({ valid: false, error: e.message });
    }
}
