// api/admin.js - FULL WITH DATABASE MEMORY
const ADMIN_PASS = "xiolimadmin123";

// GLOBAL DATABASE (shared dengan activate.js)
let globalUsers = [];

function getExpiryDateFromDays(days) {
  if (!days || days <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + parseInt(days));
  return date.toISOString().split('T')[0];
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  const seg = () => {
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { action, password, name, max_credit, days, apiKey, code } = req.body;
  const { admin, code: queryCode } = req.query;
  
  // ========== GET: cek kode aktivasi (untuk user) ==========
  if (req.method === 'GET' && !admin) {
    if (!queryCode) return res.status(400).json({ error: 'Kode diperlukan' });
    
    const cleanCode = queryCode.trim().toUpperCase();
    const found = globalUsers.find(c => c.code === cleanCode);
    
    if (!found) return res.status(404).json({ valid: false, error: 'Kode tidak ditemukan' });
    if (found.banned) return res.status(403).json({ valid: false, error: 'Kode telah dibanned' });
    
    if (found.expiry_date) {
      const today = new Date().toISOString().split('T')[0];
      if (today > found.expiry_date) {
        return res.status(403).json({ valid: false, error: `Kode kadaluarsa (${found.expiry_date})` });
      }
    }
    
    if (found.used_credit >= found.max_credit) {
      return res.status(403).json({ valid: false, error: `Credit habis (${found.used_credit}/${found.max_credit})` });
    }
    
    return res.status(200).json({
      valid: true,
      name: found.name,
      max_credit: found.max_credit,
      used_credit: found.used_credit,
      expiry_date: found.expiry_date
    });
  }
  
  // ========== POST: gunakan credit (untuk chat) ==========
  if (req.method === 'POST') {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode diperlukan' });
    
    const cleanCode = code.trim().toUpperCase();
    const found = globalUsers.find(c => c.code === cleanCode);
    
    if (!found || found.banned) {
      return res.status(404).json({ error: 'Kode tidak valid' });
    }
    
    if (found.used_credit >= found.max_credit) {
      return res.status(403).json({ error: 'Credit habis' });
    }
    
    found.used_credit++;
    
    return res.status(200).json({ 
      success: true, 
      remaining: found.max_credit - found.used_credit
    });
  }
  
  // ========== PUT: generate kode baru (admin) ==========
  if (req.method === 'PUT') {
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Password admin salah' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Nama user diperlukan' });
    }
    
    const credit = parseInt(max_credit) || 1000;
    const expiryDate = getExpiryDateFromDays(days);
    const newCode = generateCode();
    
    const newUser = {
      code: newCode,
      name: name.trim(),
      max_credit: credit,
      used_credit: 0,
      banned: false,
      expiry_date: expiryDate,
      created_at: new Date().toISOString()
    };
    
    globalUsers.push(newUser);
    
    return res.status(200).json({
      success: true,
      code: newCode,
      name: name,
      max_credit: credit,
      expiry_date: expiryDate || 'forever'
    });
  }
  
  // ========== GET: lihat semua user (admin) ==========
  if (req.method === 'GET' && admin === 'true') {
    const { password } = req.query;
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json(globalUsers);
  }
  
  // ========== DELETE: banned user ==========
  if (req.method === 'DELETE') {
    const { password, code } = req.query;
    if (password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const index = globalUsers.findIndex(c => c.code === code);
    if (index !== -1) {
      globalUsers[index].banned = true;
      return res.status(200).json({ success: true, message: 'Kode dibanned' });
    }
    return res.status(404).json({ error: 'Kode tidak ditemukan' });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
