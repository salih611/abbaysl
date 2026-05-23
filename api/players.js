export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET isteği: Oyuncuları getir
  if (req.method === 'GET') {
    try {
      // Vercel'in kalıcı depolama alanı yok, geçici çözüm
      // Alternatif: Upstash Redis veya MongoDB Atlas
      return res.status(200).json([]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POST isteği: Oyuncu kaydet
  if (req.method === 'POST') {
    try {
      const data = req.body;
      // Vercel'de dosya yazamazsın, bu yüzden bir veritabanı lazım
      return res.status(200).json({ message: 'Veri alındı', data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
