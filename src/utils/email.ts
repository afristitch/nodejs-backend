import { Resend } from 'resend';

/**
 * Email Utility
 * Handles sending verification and password reset emails via Resend
 */

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const fromEmail = process.env.FROM_EMAIL || 'Tailor App <no-reply@example.com>';

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    if (process.env.NODE_ENV === 'test') return;

    console.log(`[Email] Sending verification email to ${email}...`);

    // In local development, if no API key, just log it
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      console.log('--- Verification Email Simulation ---');
      console.log(`To: ${email}`);
      console.log(`URL: ${url}`);
      console.log('------------------------------------');
      return;
    }

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your email - SewDigital',
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #333;">Welcome to SewDigital, ${name}!</h2>
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
    });
    console.log(`[Email] Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[Email] Error sending verification email to ${email}:`, error);
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

  try {
    if (process.env.NODE_ENV === 'test') return;

    console.log(`[Email] Sending password reset email to ${email}...`);

    // In local development, if no API key, just log it
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      console.log('--- Password Reset Email Simulation ---');
      console.log(`To: ${email}`);
      console.log(`URL: ${url}`);
      console.log('--------------------------------------');
      return;
    }

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your password - SewDigital',
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
    });
    console.log(`[Email] Password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[Email] Error sending password reset email to ${email}:`, error);
  }
};

/**
 * Send credentials to a newly created user
 */
export const sendCredentialsEmail = async (
  email: string,
  name: string,
  password: string
): Promise<void> => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  try {
    if (process.env.NODE_ENV === 'test') return;

    console.log(`[Email] Sending credentials email to ${email}...`);

    // In local development, if no API key, just log it
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      console.log('--- Credentials Email Simulation ---');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`Login URL: ${loginUrl}`);
      console.log('------------------------------------');
      return;
    }

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to SewDigital - Your Account Credentials',
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #333;">Welcome to SewDigital, ${name}!</h2>
                <p>Your account has been created by your organization admin. Here are your login credentials:</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                </div>
                <p>Please log in and change your password as soon as possible for security.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
                </div>
                <p>Alternatively, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${loginUrl}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">If you have any questions, please contact your administrator.</p>
            </div>
        `,
    });
    console.log(`[Email] Credentials email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[Email] Error sending credentials email to ${email}:`, error);
  }
};

