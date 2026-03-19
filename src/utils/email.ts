import { Resend } from 'resend';
import { renderTemplate } from './template-renderer';

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

    const html = renderTemplate('verification', {
      name,
      url,
    });

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your email - SewDigital',
      html,
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

    const html = renderTemplate('password-reset', {
      name,
      url,
    });

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your password - SewDigital',
      html,
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

    const html = renderTemplate('credentials', {
      name,
      email,
      password,
      loginUrl,
    });

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to SewDigital - Your Account Credentials',
      html,
    });
    console.log(`[Email] Credentials email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[Email] Error sending credentials email to ${email}:`, error);
  }
};
/**
 * Send beta invitation email
 */
export const sendBetaInvitationEmail = async (
  email: string,
  name: string,
  platform: 'android' | 'ios'
): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'test') return;

    console.log(`[Email] Sending beta invitation email to ${email} (${platform})...`);

    // In local development, if no API key, just log it
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      console.log('--- Beta Invitation Email Simulation ---');
      console.log(`To: ${email}`);
      console.log(`Platform: ${platform}`);
      console.log('----------------------------------------');
      return;
    }

    const html = renderTemplate('beta-invitation', {
      name,
      isAndroid: platform === 'android',
      isIos: platform === 'ios',
    });

    const { data, error: resendError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to the SewDigital Beta!',
      html,
    });

    if (resendError) {
      console.error(`[Email] Resend reported an error for ${email}:`, resendError);
    } else {
      console.log(`[Email] Beta invitation email sent successfully to ${email}. ID: ${data?.id}`);
    }
  } catch (error) {
    console.error(`[Email] Error sending beta invitation email to ${email}:`, error);
  }
};
