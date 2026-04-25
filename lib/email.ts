import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('GMAIL_USER or GMAIL_PASS is not set in environment variables. Email sending skipped.');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"InSight ERP" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};

export const getWelcomeEmailTemplate = (name: string, email: string, tempPass: string) => `
<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #4f46e5; padding: 32px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to InSight ERP</h1>
  </div>
  <div style="padding: 40px 32px; background-color: #ffffff;">
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 0;">Hi <strong>${name || 'User'}</strong>,</p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">Your account has been successfully created. We are thrilled to have you on board.</p>
    
    <div style="background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 6px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Login Details</h3>
      <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 8px 0; color: #4b5563;"><strong>Temporary Password:</strong> <span style="background: #e0e7ff; padding: 4px 8px; border-radius: 4px; color: #4338ca; font-family: monospace; font-weight: 600; letter-spacing: 1px;">${tempPass}</span></p>
    </div>

    <p style="font-size: 15px; color: #6b7280; line-height: 1.5; margin-bottom: 30px;">
      For security reasons, you will be required to change your password upon your first login.
    </p>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; transition: background-color 0.2s;">Login to InSight</a>
    </div>
  </div>
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; color: #9ca3af; font-size: 13px;">&copy; ${new Date().getFullYear()} InSight ERP. All rights reserved.</p>
  </div>
</div>
`;

export const getResetPasswordTemplate = (name: string, resetLink: string) => `
<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #e11d48; padding: 32px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Request</h1>
  </div>
  <div style="padding: 40px 32px; background-color: #ffffff;">
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 0;">Hi <strong>${name || 'User'}</strong>,</p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">We received a request to reset your password for your InSight ERP account. Click the button below to choose a new password.</p>
    
    <div style="text-align: center; margin: 36px 0;">
      <a href="${resetLink}" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; transition: background-color 0.2s;">Reset Password</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin-bottom: 10px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
      This link will expire in <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
    </p>
  </div>
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; color: #9ca3af; font-size: 13px;">&copy; ${new Date().getFullYear()} InSight ERP. All rights reserved.</p>
  </div>
</div>
`;
