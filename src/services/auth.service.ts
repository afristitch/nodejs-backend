import User from '../models/User';
import Organization from '../models/Organization';
import { generateAccessToken, generateRefreshToken, generateEmailToken, verifyEmailToken, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { IUser, AuthResponse } from '../types';

/**
 * Authentication Service
 * Handles user registration, login, email verification, password reset
 */

/**
 * Register organization with admin user
 * @param {any} orgData - Organization data
 * @param {any} userData - Admin user data
 * @returns {Promise<AuthResponse>} Organization, user, and tokens
 */
export const registerOrganization = async (orgData: any, userData: any): Promise<AuthResponse> => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Create admin user first (without organization)
    const user = new User({
        ...userData,
        role: 'ORG_ADMIN',
        organizationId: 'temp', // Updated later
    });

    // Create organization
    const planService = require('./plan.service').default;
    const freePlan = await planService.getPlanByName('free');

    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 21);

    const organization = new Organization({
        ...orgData,
        createdBy: user._id,
        subscriptionStatus: 'trialing',
        subscriptionPlan: 'free',
        planId: freePlan?._id || null,
        subscriptionEndsAt,
    });



    // Update user with organization ID
    user.organizationId = organization._id;

    // Save both
    await user.save();
    await organization.save();

    // Generate email verification token
    const emailToken = generateEmailToken({ userId: user._id });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, emailToken);

    // Generate auth tokens
    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    return {
        organization,
        user,
        accessToken,
        refreshToken,
    };
};

/**
 * Login user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Promise<AuthResponse>} User and tokens
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
        // Automatically resend verification email
        const emailToken = generateEmailToken({ userId: user._id });
        await sendVerificationEmail(user.email, user.name, emailToken);

        throw new Error('Email not verified');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Remove password from user object
    user.password = '';

    return {
        user,
        accessToken,
        refreshToken,
    };
};

/**
 * Verify email using token
 * @param {String} token - Email verification token
 * @returns {Promise<IUser>} Updated user
 */
export const verifyEmail = async (token: string): Promise<IUser> => {
    try {
        // Verify token
        const decoded = verifyEmailToken(token);

        // Find and update user
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isEmailVerified) {
            throw new Error('Email already verified');
        }

        user.isEmailVerified = true;
        await user.save();

        return user;
    } catch (error: any) {
        if (error.message === 'Token has expired') {
            throw new Error('Verification link has expired');
        }
        throw error;
    }
};

/**
 * Request password reset
 * @param {String} email - User email
 * @returns {Promise<boolean>} Success
 */
export const requestPasswordReset = async (email: string): Promise<boolean> => {
    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal if email exists
        return true;
    }

    // Generate reset token
    const resetToken = generateEmailToken({ userId: user._id });

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return true;
};

/**
 * Reset password using token
 * @param {String} token - Password reset token
 * @param {String} newPassword - New password
 * @returns {Promise<IUser>} Updated user
 */
export const resetPassword = async (token: string, newPassword: string): Promise<IUser> => {
    try {
        // Verify token
        const decoded = verifyEmailToken(token);

        // Find user
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return user;
    } catch (error: any) {
        if (error.message === 'Token has expired') {
            throw new Error('Reset link has expired');
        }
        throw error;
    }
};

/**
 * Refresh access token
 * @param {String} refreshToken - Refresh token
 * @returns {Promise<{ accessToken: string }>} New access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
    try {
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Generate new access token
        const accessToken = generateAccessToken({ userId: decoded.userId });

        return { accessToken };
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Resend email verification link
 * @param {String} email - User email
 * @returns {Promise<boolean>} Success (returns true even if user not found for security)
 */
export const resendVerification = async (email: string): Promise<boolean> => {
    const user = await User.findOne({ email });

    if (!user) {
        return true;
    }

    if (user.isEmailVerified) {
        throw new Error('Email already verified');
    }

    // Generate email verification token
    const emailToken = generateEmailToken({ userId: user._id });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, emailToken);

    return true;
};

/**
 * Update user password
 * @param {String} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 * @returns {Promise<IUser>} Updated user
 */
export const updatePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<IUser> => {
    // Find user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw new Error('User not found');
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new Error('Invalid current password');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return user;
};

const authService = {
    registerOrganization,
    login,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    resendVerification,
    updatePassword,
};

export default authService;
