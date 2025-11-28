// api/send-email.js
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      title, 
      content, 
      labels, 
      description, 
      focusKeyword, 
      seoScore, 
      authorName,
      postId,
      timestamp 
    } = req.body;

    // Validasi data yang diperlukan
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Setup transporter Zoho
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    });

    // Format email content
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
          .label { display: inline-block; background: #007bff; color: white; padding: 2px 8px; border-radius: 3px; margin: 2px; font-size: 12px; }
          .seo-score { font-weight: bold; color: #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Artikel Baru Dipublikasikan</h1>
            <p><strong>ID Artikel:</strong> ${postId}</p>
            <p><strong>Waktu:</strong> ${timestamp}</p>
          </div>

          <div class="section">
            <h2>📌 Informasi Penulis</h2>
            <p><strong>Penulis:</strong> ${authorName || 'Tidak tersedia'}</p>
          </div>

          <div class="section">
            <h2>🎯 Judul Artikel</h2>
            <p>${title}</p>
          </div>

          <div class="section">
            <h2>📋 Deskripsi Penelusuran</h2>
            <p>${description || 'Tidak ada deskripsi'}</p>
          </div>

          <div class="section">
            <h2>🏷️ Label/Kategori</h2>
            <div>
              ${labels ? labels.split(',').map(label => 
                `<span class="label">${label.trim()}</span>`
              ).join('') : 'Tidak ada label'}
            </div>
          </div>

          <div class="section">
            <h2>🔍 Analisis SEO</h2>
            <p><strong>Focus Keyword:</strong> ${focusKeyword || 'Tidak diisi'}</p>
            <p><strong>SEO Score:</strong> <span class="seo-score">${seoScore}%</span></p>
          </div>

          <div class="section">
            <h2>📄 Konten Artikel</h2>
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; background: white;">
              ${content}
            </div>
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center;">
            <p><em>Email ini dikirim otomatis dari sistem Jejak Mufassir</em></p>
            <p><small>Timestamp: ${new Date().toLocaleString('id-ID')}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Text version untuk email client yang sederhana
    const textContent = `
      ARTIKEL BARU DIPUBLIKASIKAN
      ============================
      
      Judul: ${title}
      Penulis: ${authorName || 'Tidak tersedia'}
      ID Artikel: ${postId}
      Waktu: ${timestamp}
      
      Deskripsi: ${description || 'Tidak ada deskripsi'}
      
      Label: ${labels || 'Tidak ada label'}
      
      SEO Analysis:
      - Focus Keyword: ${focusKeyword || 'Tidak diisi'}
      - SEO Score: ${seoScore}%
      
      Konten artikel terlampir dalam format HTML.
    `;

    // Konfigurasi email
    const mailOptions = {
      from: process.env.ZOHO_EMAIL,
      to: ['ahmadyani.official@gmail.com', 'admin@jejakmufassir.my.id'],
      subject: `📝 Artikel Baru: ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`,
      text: textContent,
      html: emailContent,
    };

    // Kirim email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', result.messageId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
}
