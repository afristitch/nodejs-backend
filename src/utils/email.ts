import nodemailer from 'nodemailer';

/**
 * Email Utility
 * Handles sending verification and password reset emails
 */

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Verify your email - Tailor API',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #333;">Welcome to Tailor API, ${name}!</h2>
                <p>Thank you for registering. Please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                </div>
                <p>Alternatively, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${url}</p>
                <p>This verification link will expire in 1 hour.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">If you did not create an account, please ignore this email.</p>
            </div>
        `,
  };

  try {
    if (process.env.NODE_ENV === 'test') return;

    // In local development, if no email credentials, just log it
    if (!process.env.EMAIL_USER && process.env.NODE_ENV === 'development') {
      console.log('--- Verification Email Simulation ---');
      console.log(`To: ${email}`);
      console.log(`URL: ${url}`);
      console.log('------------------------------------');
      return;
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't throw to prevent blocking the registration flow
  }
};

/**
 * Send password reset link
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Reset your password - Tailor API',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>We received a request to reset your password. Please click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background-color: #f44336; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Alternatively, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${url}</p>
                <p>This reset link will expire in 1 hour.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">If you did not request a password reset, please ignore this email.</p>
            </div>
        `,
  };

  try {
    if (process.env.NODE_ENV === 'test') return;

    // In local development, if no email credentials, just log it
    if (!process.env.EMAIL_USER && process.env.NODE_ENV === 'development') {
      console.log('--- Password Reset Email Simulation ---');
      console.log(`To: ${email}`);
      console.log(`URL: ${url}`);
      console.log('--------------------------------------');
      return;
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};
