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
      email, // Email penulis - DITAMBAHKAN
      postID,
      timestamp 
    } = req.body;

    console.log('📧 Received email request for post:', postID);
    console.log('👤 Author email:', email);

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

    // Format email content untuk ADMIN
    const adminEmailContent = `
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
            <p><strong>Email Penulis:</strong> ${email || 'Tidak tersedia'}</p>
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

    // Format email content untuk PENULIS
    const authorEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px; }
          .message-box { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 Terima Kasih Telah Menerbitkan!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Jejak Mufassir</p>
          </div>
          
          <div class="content">
            <h2 style="color: #2c3e50; margin-top: 0;">Halo, ${name || 'Penulis'}! 👋</h2>
            
            <div class="message-box">
              <h3 style="color: #28a745; margin-top: 0;">📝 Status Artikel Anda</h3>
              <p style="font-size: 16px; line-height: 1.6;">
                <strong>"Proses penerbitan memerlukan waktu, harap tunggu sebentar ya. Terima kasih"</strong>
              </p>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1976d2; margin-top: 0;">📋 Detail Artikel</h4>
              <p><strong>Judul:</strong> ${title}</p>
              <p><strong>ID Artikel:</strong> ${postID}</p>
              <p><strong>Waktu Submit:</strong> ${timestamp}</p>
            </div>

            <p style="color: #666; line-height: 1.6;">
              Tim Jejak Mufassir sedang memproses artikel Anda. Kami akan melakukan review dan optimasi untuk memastikan kualitas terbaik sebelum dipublikasikan.
            </p>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin-top: 0;">⏰ Perkiraan Waktu Proses</h4>
              <p style="margin: 0; color: #856404;">
                Proses review biasanya memakan waktu 1-3 hari kerja. Anda akan mendapatkan notifikasi ketika artikel sudah live.
              </p>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">
              <strong>Jejak Mufassir</strong><br>
              Investasikan Tulisanmu untuk Masa Depan yang Cerah<br>
              <em>Email ini dikirim otomatis, mohon tidak membalas email ini.</em>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Array untuk menyimpan hasil pengiriman email
    const emailResults = [];

    // 1. Kirim email ke ADMIN
    const adminMailOptions = {
      from: `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`,
      to: ['ahmadyani.official@gmail.com', 'admin@jejakmufassir.my.id'],
      subject: `📝 Artikel Baru: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`,
      html: adminEmailContent,
    };

    console.log('📤 Sending email to admins...');
    try {
      const adminResult = await transporter.sendMail(adminMailOptions);
      console.log('✅ Email to admins sent successfully:', adminResult.messageId);
      emailResults.push({
        recipient: 'admins',
        success: true,
        messageId: adminResult.messageId
      });
    } catch (adminError) {
      console.error('❌ Failed to send email to admins:', adminError);
      emailResults.push({
        recipient: 'admins',
        success: false,
        error: adminError.message
      });
    }

    // 2. Kirim email ke PENULIS (jika email tersedia)
    if (email && email.includes('@')) {
      const authorMailOptions = {
        from: `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`,
        to: email,
        subject: `📝 Status Artikel: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`,
        html: authorEmailContent,
      };

      console.log('📤 Sending email to author:', email);
      try {
        const authorResult = await transporter.sendMail(authorMailOptions);
        console.log('✅ Email to author sent successfully:', authorResult.messageId);
        emailResults.push({
          recipient: 'author',
          success: true,
          messageId: authorResult.messageId
        });
      } catch (authorError) {
        console.error('❌ Failed to send email to author:', authorError);
        emailResults.push({
          recipient: 'author',
          success: false,
          error: authorError.message
        });
      }
    } else {
      console.log('⚠️ No valid author email provided, skipping author notification');
      emailResults.push({
        recipient: 'author',
        success: false,
        error: 'No valid email provided'
      });
    }

    // Cek hasil pengiriman email
    const allSuccessful = emailResults.every(result => result.success);
    const someSuccessful = emailResults.some(result => result.success);

    if (allSuccessful) {
      console.log('🎉 All emails sent successfully');
      return res.status(200).json({ 
        success: true, 
        message: 'All emails sent successfully',
        results: emailResults 
      });
    } else if (someSuccessful) {
      console.log('⚠️ Some emails sent successfully');
      return res.status(207).json({ 
        success: true, 
        message: 'Some emails sent successfully',
        results: emailResults 
      });
    } else {
      console.log('❌ All emails failed');
      return res.status(500).json({ 
        success: false, 
        error: 'All emails failed to send',
        results: emailResults 
      });
    }

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
}
