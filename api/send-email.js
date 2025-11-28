// api/send-email.js - ZOHO ONLY
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

    console.log('📧 Processing email for post:', postId);

    // Validasi environment variables
    if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
      console.error('❌ Missing Zoho configuration');
      return res.status(500).json({ 
        success: false,
        error: 'Zoho email not configured',
        details: 'Check ZOHO_EMAIL and ZOHO_PASSWORD environment variables' 
      });
    }

    console.log('📧 Zoho Email:', process.env.ZOHO_EMAIL);
    console.log('🔑 Zoho Password length:', process.env.ZOHO_PASSWORD?.length);

    // Setup Zoho transporter dengan configuration yang tepat
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false, // false for TLS
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('🔄 Testing Zoho SMTP connection...');

    // Verify connection
    try {
      await transporter.verify();
      console.log('✅ Zoho SMTP connection successful');
    } catch (verifyError) {
      console.error('❌ Zoho SMTP connection failed:', verifyError);
      return res.status(500).json({ 
        success: false,
        error: 'Zoho SMTP connection failed',
        details: verifyError.message 
      });
    }

    // Email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .label { display: inline-block; background: #007bff; color: white; padding: 2px 8px; border-radius: 3px; margin: 2px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #2c3e50;">📝 Artikel Baru Dipublikasikan</h1>
            <p><strong>ID Artikel:</strong> ${postId}</p>
            <p><strong>Waktu:</strong> ${timestamp}</p>
        </div>

        <div class="section">
            <h3 style="margin-top: 0; color: #2c3e50;">👤 Informasi Penulis</h3>
            <p><strong>Penulis:</strong> ${authorName || 'Tidak tersedia'}</p>
        </div>

        <div class="section">
            <h3 style="margin-top: 0; color: #2c3e50;">🎯 Judul Artikel</h3>
            <p style="font-size: 18px; font-weight: bold; color: #2c3e50;">${title}</p>
        </div>

        <div class="section">
            <h3 style="margin-top: 0; color: #2c3e50;">📋 Deskripsi Penelusuran</h3>
            <p>${description || 'Tidak ada deskripsi'}</p>
        </div>

        <div class="section">
            <h3 style="margin-top: 0; color: #2c3e50;">🏷️ Label/Kategori</h3>
            <div>
                ${labels ? labels.split(',').map(label => 
                    `<span class="label">${label.trim()}</span>`
                ).join('') : 'Tidak ada label'}
            </div>
        </div>

        <div class="section">
            <h3 style="margin-top: 0; color: #2c3e50;">🔍 Analisis SEO</h3>
            <p><strong>Focus Keyword:</strong> ${focusKeyword || 'Tidak diisi'}</p>
            <p><strong>SEO Score:</strong> <span style="color: #28a745; font-weight: bold;">${seoScore}%</span></p>
        </div>

        <div class="section">
            <h3 style="margin-top: 0; color: #2c3e50;">📄 Konten Artikel</h3>
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; background: white;">
                ${content}
            </div>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #6c757d;"><em>Email ini dikirim otomatis dari sistem Jejak Mufassir</em></p>
        </div>
    </div>
</body>
</html>
    `;

    // Text version
    const textContent = `
ARTIKEL BARU DIPUBLIKASIKAN - JEJAK MUFASSIR
=============================================

Judul: ${title}
Penulis: ${authorName || 'Tidak tersedia'}
ID Artikel: ${postId}
Waktu: ${timestamp}

Deskripsi: ${description || 'Tidak ada deskripsi'}

Label: ${labels || 'Tidak ada label'}

SEO Analysis:
- Focus Keyword: ${focusKeyword || 'Tidak diisi'}
- SEO Score: ${seoScore}%

---
Konten artikel lengkap tersedia dalam format HTML.
    `;

    // Email configuration
    const mailOptions = {
      from: `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`,
      to: 'ahmadyani.official@gmail.com', // Kirim ke Gmail
      subject: `📝 ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`,
      text: textContent,
      html: emailContent,
    };

    console.log('📤 Sending email via Zoho...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully via Zoho!');
    console.log('📨 Message ID:', result.messageId);
    console.log('🔧 Response:', result.response);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully via Zoho',
      messageId: result.messageId,
      service: 'Zoho'
    });

  } catch (error) {
    console.error('❌ Zoho email error:', error);
    
    let errorDetails = {
      message: error.message,
      code: error.code,
      command: error.command
    };

    return res.status(500).json({ 
      success: false,
      error: 'Failed to send email via Zoho',
      details: error.message,
      debug: errorDetails
    });
  }
}
