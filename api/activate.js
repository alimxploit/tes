// api/activate.js
// Data kode aktivasi (tersimpan di memory Vercel)
let codes = [];

// Password admin
const ADMIN_PASS = "xiolimadmin123";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // GET: cek status kode (untuk user aktivasi)
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Kode diperlukan' });
    
    const cleanCode = code.trim().toUpperCase();
    const found = codes.find(c => c.code === cleanCode);
    
    if (!found) return res.status(404).json({ valid: false, error: 'Kode tidak ditemukan' });
    if (found.banned) return res.status(403).json({ valid: false, error: 'Kode telah dibanned' });
    
    return res.status(200).json({
      valid: true,
      name: found.name,
      unlimited: true,
      message: "Aktivasi berhasil! Credit UNLIMITED."
    });
  }
  
  // POST: gunakan credit (tapi karena unlimited, gak perlu kurangi)
  if (req.method === 'POST') {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode diperlukan' });
    
    const cleanCode = code.trim().toUpperCase();
    const found = codes.find(c => c.code === cleanCode);
    
    if (!found || found.banned) {
      return res.status(404).json({ error: 'Kode tidak valid' });
    }
    
    return res.status(200).json({ success: true, unlimited: true });
  }
  
  // ADMIN: generate kode baru (UNLIMITED)
  if (req.method === 'PUT') {
    const { password, name } = req.body;
    
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Password admin salah' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Nama user diperlukan' });
    }
    
    // Generate kode random
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    const seg = () => {
      let s = '';
      for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    };
    const newCode = `${seg()}-${seg()}-${seg()}-${seg()}`;
    
    codes.push({
      code: newCode,
      name: name.trim(),
      banned: false,
      unlimited: true,
      created_at: new Date().toISOString()
    });
    
    return res.status(200).json({
      success: true,
      code: newCode,
      name: name,
      message: "Kode UNLIMITED berhasil dibuat"
    });
  }
  
  // ADMIN: lihat semua kode
  if (req.method === 'GET' && req.query.admin === 'true') {
    const { password } = req.query;
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json(codes);
  }
  
  // ADMIN: banned kode
  if (req.method === 'DELETE') {
    const { password, code } = req.query;
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const index = codes.findIndex(c => c.code === code);
    if (index !== -1) {
      codes[index].banned = true;
      return res.status(200).json({ success: true, message: 'Kode dibanned' });
    }
    return res.status(404).json({ error: 'Kode tidak ditemukan' });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
  }
