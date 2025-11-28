// api/send-email.js - PERBAIKAN CORS
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Set CORS headers - DIPERBAIKI
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://www.jejakmufassir.my.id');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight request - DIPERBAIKI
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }


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
      timestamp,
      userUID // Tambahkan userUID dari request body
    } = req.body;

    console.log('📧 Received email request for post:', postID);
    console.log('👤 User UID:', userUID);

    // Validasi data yang diperlukan
    if (!title || !content || !userUID) {
      return res.status(400).json({ 
        error: 'Title, content, and userUID are required' 
      });
    }

    // Validasi environment variables
    if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
      console.error('❌ Missing email configuration');
      return res.status(500).json({ 
        error: 'Email service not configured',
        details: 'Check ZOHO_EMAIL and ZOHO_PASSWORD environment variables' 
      });
    }

    // Validasi Firebase environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_DATABASE_URL) {
      console.error('❌ Missing Firebase configuration');
      return res.status(500).json({ 
        error: 'Firebase service not configured',
        details: 'Check Firebase environment variables' 
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

    // 🔥 AMBIL EMAIL USER DARI REALTIME DATABASE
    console.log('🔍 Fetching user email from Firebase...');
    let userEmail = null;
    
    try {
      const userRef = admin.database().ref(`users/${userUID}`);
      const snapshot = await userRef.once('value');
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        userEmail = userData.email;
        console.log('✅ User email found:', userEmail);
      } else {
        console.error('❌ User not found in database for UID:', userUID);
        return res.status(404).json({ 
          error: 'User not found',
          details: `No user data found for UID: ${userUID}`
        });
      }
    } catch (firebaseError) {
      console.error('❌ Error fetching user data from Firebase:', firebaseError);
      return res.status(500).json({ 
        error: 'Failed to fetch user data',
        details: firebaseError.message 
      });
    }

    // Validasi email user
    if (!userEmail || !userEmail.includes('@')) {
      console.error('❌ Invalid user email:', userEmail);
      return res.status(400).json({ 
        error: 'Invalid user email',
        details: 'User email is missing or invalid' 
      });
    }

    // Fungsi untuk membuat konten email yang lengkap (untuk ahmadyani.official@gmail.com)
    const createDetailedEmailContent = () => {
      return `
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
              <p><strong>Email Penulis:</strong> ${userEmail}</p>
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
    };

    // Fungsi untuk membuat konten email sederhana (untuk user email dari database)
    const createSimpleEmailContent = () => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #2c3e50;">📝 Status Artikel</h1>
            </div>

            <div style="padding: 20px; text-align: center;">
              <h2 style="color: #2c3e50;">Tulisan Artikel Anda sedang diproses.</h2>
              <p style="font-size: 16px; color: #495057;">Terima kasih telah berkontribusi!</p>
              
              <div style="margin: 30px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <p><strong>Judul:</strong> ${title}</p>
                <p><strong>ID Artikel:</strong> ${postID}</p>
                <p><strong>Waktu Submit:</strong> ${timestamp}</p>
                <p><strong>Penulis:</strong> ${name || 'Tidak tersedia'}</p>
              </div>
              
              <p style="color: #6c757d;">Kami akan meninjau artikel Anda dan akan memberikan update lebih lanjut.</p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center;">
              <p style="margin: 0; color: #6c757d;"><em>Email ini dikirim otomatis dari sistem Jejak Mufassir</em></p>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    console.log('📤 Sending emails to multiple recipients...');

    // Kirim email ke ahmadyani.official@gmail.com (versi lengkap)
    const mailOptionsAhmad = {
      from: `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`,
      to: 'ahmadyani.official@gmail.com',
      subject: `📝 ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`,
      html: createDetailedEmailContent(),
    };

    // Kirim email ke user (versi sederhana)
    const mailOptionsUser = {
      from: `"Jejak Mufassir" <${process.env.ZOHO_EMAIL}>`,
      to: userEmail,
      subject: `📝 Status Artikel: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`,
      html: createSimpleEmailContent(),
    };

    // Kirim kedua email secara paralel
    const [resultAhmad, resultUser] = await Promise.all([
      transporter.sendMail(mailOptionsAhmad),
      transporter.sendMail(mailOptionsUser)
    ]);

    console.log('✅ Emails sent successfully:');
    console.log('   - To ahmadyani.official@gmail.com:', resultAhmad.messageId);
    console.log('   - To user email:', userEmail, resultUser.messageId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Emails sent successfully to both recipients',
      messageIds: {
        ahmad: resultAhmad.messageId,
        user: resultUser.messageId
      },
      userEmail: userEmail
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
}
