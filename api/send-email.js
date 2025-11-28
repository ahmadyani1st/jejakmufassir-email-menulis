// api/send-email.js - Dengan Zoho + Gmail Fallback
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.jejakmufassir.my.id');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    console.log('📧 Processing email for:', postId);

    let transporter;
    let emailService = 'Unknown';

    // Coba Zoho dulu, jika ada configuration
    if (process.env.ZOHO_EMAIL && process.env.ZOHO_PASSWORD) {
      console.log('🔄 Trying Zoho mail...');
      try {
        transporter = nodemailer.createTransport({
          host: 'smtp.zoho.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.ZOHO_EMAIL,
            pass: process.env.ZOHO_PASSWORD,
          },
        });
        emailService = 'Zoho';
        
        // Test connection
        await transporter.verify();
        console.log('✅ Zoho connection successful');
      } catch (zohoError) {
        console.log('❌ Zoho failed, trying Gmail...');
        transporter = null;
      }
    }

    // Jika Zoho gagal atau tidak ada, gunakan Gmail
    if (!transporter && process.env.GMAIL_EMAIL && process.env.GMAIL_PASSWORD) {
      console.log('🔄 Using Gmail...');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
      emailService = 'Gmail';
    }

    if (!transporter) {
      return res.status(500).json({ 
        error: 'No email service configured',
        details: 'Please setup ZOHO_EMAIL/ZOHO_PASSWORD or GMAIL_EMAIL/GMAIL_PASSWORD' 
      });
    }

    // Email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 15px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Artikel Baru - Jejak Mufassir</h1>
            <p><strong>ID:</strong> ${postId}</p>
            <p><strong>Waktu:</strong> ${timestamp}</p>
            <p><small>Sent via: ${emailService}</small></p>
        </div>
        
        <div class="section">
            <h3>👤 Penulis</h3>
            <p>${authorName || 'Tidak tersedia'}</p>
        </div>
        
        <div class="section">
            <h3>🎯 Judul</h3>
            <p><strong>${title}</strong></p>
        </div>
        
        <div class="section">
            <h3>📋 Deskripsi</h3>
            <p>${description || 'Tidak ada deskripsi'}</p>
        </div>
        
        <div class="section">
            <h3>🏷️ Label</h3>
            <p>${labels || 'Tidak ada label'}</p>
        </div>
        
        <div class="section">
            <h3>🔍 SEO Analysis</h3>
            <p><strong>Keyword:</strong> ${focusKeyword || 'Tidak diisi'}</p>
            <p><strong>Score:</strong> ${seoScore}%</p>
        </div>
        
        <div class="section">
            <h3>📄 Konten</h3>
            <div style="max-height: 300px; overflow-y: auto; padding: 10px; background: white; border: 1px solid #ddd;">
                ${content}
            </div>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
      from: emailService === 'Zoho' 
        ? `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`
        : `"Jejak Mufassir" <${process.env.GMAIL_EMAIL}>`,
      to: 'ahmadyani.official@gmail.com',
      subject: `📝 ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`,
      html: emailContent,
    };

    console.log(`📤 Sending email via ${emailService}...`);
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', result.messageId);

    return res.status(200).json({ 
      success: true, 
      message: `Email sent successfully via ${emailService}`,
      messageId: result.messageId,
      service: emailService
    });

  } catch (error) {
    console.error('❌ Email error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send email',
      details: error.message,
      service: 'Unknown'
    });
  }
}
