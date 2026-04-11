// api/activate.js
let codes = [];
const ADMIN_PASS = "xiolimadmin123";

function getExpiryDateFromDays(days) {
  if (!days || days <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + parseInt(days));
  return date.toISOString().split('T')[0];
}

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
    
    // Cek expired
    if (found.expiry_date) {
      const today = new Date().toISOString().split('T')[0];
      if (today > found.expiry_date) {
        return res.status(403).json({ valid: false, error: `Kode kadaluarsa (${found.expiry_date})` });
      }
    }
    
    // Cek credit
    if (found.used_credit >= found.max_credit) {
      return res.status(403).json({ valid: false, error: `Credit habis (${found.used_credit}/${found.max_credit})` });
    }
    
    return res.status(200).json({
      valid: true,
      name: found.name,
      max_credit: found.max_credit,
      used_credit: found.used_credit,
      expiry_date: found.expiry_date,
      message: "Aktivasi berhasil!"
    });
  }
  
  // POST: gunakan credit (kurangi 1 setiap chat)
  if (req.method === 'POST') {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode diperlukan' });
    
    const cleanCode = code.trim().toUpperCase();
    const found = codes.find(c => c.code === cleanCode);
    
    if (!found || found.banned) {
      return res.status(404).json({ error: 'Kode tidak valid' });
    }
    
    if (found.used_credit >= found.max_credit) {
      return res.status(403).json({ error: 'Credit habis' });
    }
    
    found.used_credit++;
    
    return res.status(200).json({ 
      success: true, 
      remaining: found.max_credit - found.used_credit,
      total: found.max_credit,
      used: found.used_credit
    });
  }
  
  // ADMIN: generate kode baru (DENGAN CREDIT & WAKTU)
  if (req.method === 'PUT') {
    const { password, name, max_credit, days } = req.body;
    
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Password admin salah' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Nama user diperlukan' });
    }
    
    const credit = parseInt(max_credit) || 1000;
    const expiryDate = getExpiryDateFromDays(days);
    
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
      max_credit: credit,
      used_credit: 0,
      banned: false,
      expiry_date: expiryDate,
      created_at: new Date().toISOString()
    });
    
    return res.status(200).json({
      success: true,
      code: newCode,
      name: name,
      max_credit: credit,
      expiry_date: expiryDate || 'forever',
      message: "Kode berhasil dibuat"
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
  
  // ADMIN: perpanjang kode
  if (req.method === 'PATCH') {
    const { password, code, days, add_credit } = req.body;
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const index = codes.findIndex(c => c.code === code);
    if (index === -1) {
      return res.status(404).json({ error: 'Kode tidak ditemukan' });
    }
    
    if (days && days > 0) {
      const newExpiry = getExpiryDateFromDays(days);
      codes[index].expiry_date = newExpiry;
    }
    
    if (add_credit && add_credit > 0) {
      codes[index].max_credit += parseInt(add_credit);
    }
    
    codes[index].banned = false;
    
    return res.status(200).json({ 
      success: true, 
      user: codes[index],
      message: 'User diperpanjang'
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
