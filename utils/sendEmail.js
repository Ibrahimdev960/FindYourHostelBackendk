// utils/sendEmail.js

const nodemailer = require('nodemailer');

const sendVerificationEmail = async (to, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS, // Your Gmail App Password
    },
  });

  const verificationLink = `${process.env.BASE_URL}/users/verify-email?token=${token}`;

  const mailOptions = {
    from: `"FindYourHostel" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Email Verification',
    html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${verificationLink}">Verify Email</a>`,
  };
console.log('Sending email to:', to);
console.log('Verification link:', verificationLink);
await transporter.sendMail(mailOptions);

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
