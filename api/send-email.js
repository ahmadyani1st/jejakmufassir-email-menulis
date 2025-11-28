// api/send-email.js
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Set CORS headers - PERBAIKAN: Tambahkan origin spesifik
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://www.jejakmufassir.my.id');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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

    console.log('Received email request for post:', postId);

    // Validasi data yang diperlukan
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Validasi environment variables
    if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
      console.error('Missing email configuration');
      return res.status(500).json({ error: 'Email service not configured' });
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
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified');
    } catch (verifyError) {
      console.error('SMTP connection failed:', verifyError);
      return res.status(500).json({ error: 'Email service unavailable' });
    }

    // Format email content
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
          .label { display: inline-block; background: #007bff; color: white; padding: 2px 8px; border-radius: 3px; margin: 2px; font-size: 12px; }
          .seo-score { font-weight: bold; color: #28a745; }
          .content-preview { max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; background: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #333;">📝 Artikel Baru Dipublikasikan</h1>
            <p><strong>ID Artikel:</strong> ${postId}</p>
            <p><strong>Waktu:</strong> ${timestamp}</p>
          </div>

          <div class="section">
            <h2 style="margin-top: 0;">📌 Informasi Penulis</h2>
            <p><strong>Penulis:</strong> ${authorName || 'Tidak tersedia'}</p>
          </div>

          <div class="section">
            <h2 style="margin-top: 0;">🎯 Judul Artikel</h2>
            <p style="font-size: 18px; font-weight: bold;">${title}</p>
          </div>

          <div class="section">
            <h2 style="margin-top: 0;">📋 Deskripsi Penelusuran</h2>
            <p>${description || 'Tidak ada deskripsi'}</p>
          </div>

          <div class="section">
            <h2 style="margin-top: 0;">🏷️ Label/Kategori</h2>
            <div>
              ${labels ? labels.split(',').map(label => 
                `<span class="label">${label.trim()}</span>`
              ).join('') : 'Tidak ada label'}
            </div>
          </div>

          <div class="section">
            <h2 style="margin-top: 0;">🔍 Analisis SEO</h2>
            <p><strong>Focus Keyword:</strong> ${focusKeyword || 'Tidak diisi'}</p>
            <p><strong>SEO Score:</strong> <span class="seo-score">${seoScore}%</span></p>
          </div>

          <div class="section">
            <h2 style="margin-top: 0;">📄 Konten Artikel</h2>
            <div class="content-preview">
              ${content}
            </div>
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center;">
            <p style="margin: 0;"><em>Email ini dikirim otomatis dari sistem Jejak Mufassir</em></p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              <small>Dikirim pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</small>
            </p>
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
----------------------------------------
    `;

    // Konfigurasi email
    const mailOptions = {
      from: `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`,
      to: ['ahmadyani.official@gmail.com', 'admin@jejakmufassir.my.id'],
      subject: `📝 Artikel Baru: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`,
      text: textContent,
      html: emailContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    console.log('Attempting to send email...');

    // Kirim email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', result.messageId);
    console.log('Response:', result.response);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Berikan error message yang lebih spesifik
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed - check email credentials';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Cannot connect to email server';
    } else if (error.response) {
      errorMessage = `Email server error: ${error.response}`;
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
}
