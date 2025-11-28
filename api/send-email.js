
// api/send-email.js
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Set CORS headers
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
      name,
      postID,
      timestamp 
    } = req.body;

    console.log('📧 Received email request for post:', postID);

    // Validasi data yang diperlukan
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Validasi environment variables
    if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
      console.error('❌ Missing email configuration');
      return res.status(500).json({ 
        error: 'Email service not configured',
        details: 'Check ZOHO_EMAIL and ZOHO_PASSWORD environment variables' 
      });
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

    console.log('🔄 Testing SMTP connection...');

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP connection failed:', verifyError);
      return res.status(500).json({ 
        error: 'SMTP connection failed',
        details: verifyError.message 
      });
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
          .section { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .label { display: inline-block; background: #007bff; color: white; padding: 2px 8px; border-radius: 3px; margin: 2px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #2c3e50;">📝 Artikel Baru Dipublikasikan</h1>
            <p><strong>ID Artikel:</strong> ${postID}</p>
            <p><strong>Waktu:</strong> ${timestamp}</p>
          </div>

          <div class="section">
            <h3 style="margin-top: 0; color: #2c3e50;">👤 Informasi Penulis</h3>
            <p><strong>Penulis:</strong> ${name || 'Tidak tersedia'}</p>
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

    // Konfigurasi email
    const mailOptions = {
      from: `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`,
      to: ['ahmadyani.official@gmail.com', 'admin@jejakmufassir.my.id'],
      subject: `📝 ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`,
      html: emailContent,
    };

    console.log('📤 Sending email...');

    // Kirim email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', result.messageId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
}
