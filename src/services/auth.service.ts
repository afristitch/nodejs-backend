import User from '../models/User';
import Organization from '../models/Organization';
import OrganizationMembership from '../models/OrganizationMembership';
import { generateAccessToken, generateRefreshToken, generateEmailToken, verifyEmailToken, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { IUser, AuthResponse, UserRole } from '../types';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
export const registerOrganization = async (orgData: any, userData: any, referralCode?: string): Promise<AuthResponse> => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Check if organization email already exists
    if (orgData && orgData.email) {
        const existingOrg = await Organization.findOne({ email: orgData.email });
        if (existingOrg) {
            throw new Error('Organization email already registered');
        }
    }

    // Create admin user first
    const user = new User({
        ...userData,
    });

    // Create organization
    const planService = require('./plan.service').default;
    const freePlan = await planService.getPlanByName('free');

    const generateSlug = (name: string) => {
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const randomString = Math.random().toString(36).substring(2, 8);
        return baseSlug ? `${baseSlug}-${randomString}` : randomString;
    };

    const orgName = orgData?.name || `${userData.name}'s Shop`;
    const orgEmail = orgData?.email || userData.email;

    const organization = new Organization({
        ...orgData,
        name: orgName,
        email: orgEmail,
        slug: generateSlug(orgName),
        createdBy: user._id,
        subscriptionStatus: 'active',
        subscriptionPlan: 'free',
        planId: freePlan?._id || null,
        referralCode,
        isSetupComplete: !!(orgData && orgData.name && orgData.email),
    });


    // Save both
    await user.save();
    await organization.save();

    // Create Membership
    const membership = new OrganizationMembership({
        userId: user._id,
        organizationId: organization._id,
        role: UserRole.ORG_ADMIN,
        status: 'active'
    });
    await membership.save();

    // Generate email verification token
    const emailToken = generateEmailToken({ userId: user._id });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, emailToken);

    // Generate auth tokens
    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    return {
        user,
        accessToken,
        refreshToken,
        memberships: [{ ...membership.toObject(), organization: organization.toObject() }],
        organization, // Legacy fallback
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

    let memberships = await OrganizationMembership.find({ userId: user._id, status: 'active' }).lean();

    // Check if they have a personal workspace (where they are ORG_ADMIN)
    const hasAdminWorkspace = memberships.some(m => m.role === 'ORG_ADMIN');

    if (!hasAdminWorkspace) {
        const Organization = (await import('../models/Organization')).default;
        
        const personalOrg = new Organization({
            name: `${user.name.split(' ')[0]}'s Workspace`,
            email: user.email,
            phone: (user as any).phone || '',
            subscriptionPlan: 'free',
            subscriptionStatus: 'ACTIVE',
        });
        await personalOrg.save();

        const membership = new OrganizationMembership({
            organizationId: personalOrg._id,
            userId: user._id,
            role: 'ORG_ADMIN',
            status: 'active'
        });
        await membership.save();
        
        // Add to memberships array
        memberships.push(membership.toObject() as any);
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
    // Populate organizations for the response
    const populatedMemberships = await Promise.all(memberships.map(async (m) => {
        const org = await Organization.findById(m.organizationId).lean();
        return { ...m, organization: org };
    }));

    return {
        user,
        accessToken,
        refreshToken,
        memberships: populatedMemberships as any,
        organization: populatedMemberships[0]?.organization as any, // Legacy fallback
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

/**
 * Helper to get or create user and default organization via OAuth
 */
const getOrCreateOAuthUser = async (
    email: string,
    name: string,
    providerData: { googleId?: string; appleId?: string },
    isEmailVerified: boolean = true
): Promise<AuthResponse> => {
    let user = await User.findOne({ email });

    if (user) {
        // Update user with new provider ID if not present
        let updated = false;
        if (providerData.googleId && !user.googleId) {
            user.googleId = providerData.googleId;
            updated = true;
        }
        if (providerData.appleId && !user.appleId) {
            user.appleId = providerData.appleId;
            updated = true;
        }
        if (!user.isEmailVerified && isEmailVerified) {
            user.isEmailVerified = true;
            updated = true;
        }
        if (updated) await user.save();

        let memberships = await OrganizationMembership.find({ userId: user._id, status: 'active' }).lean();
        
        const hasAdminWorkspace = memberships.some(m => m.role === 'ORG_ADMIN');

        if (!hasAdminWorkspace) {
            const Organization = (await import('../models/Organization')).default;
            
            const personalOrg = new Organization({
                name: `${user.name.split(' ')[0]}'s Workspace`,
                email: user.email,
                phone: (user as any).phone || '',
                subscriptionPlan: 'free',
                subscriptionStatus: 'ACTIVE',
            });
            await personalOrg.save();

            const membership = new OrganizationMembership({
                organizationId: personalOrg._id,
                userId: user._id,
                role: 'ORG_ADMIN',
                status: 'active'
            });
            await membership.save();
            
            memberships.push(membership.toObject() as any);
        }

        const accessToken = generateAccessToken({ userId: user._id });
        const refreshToken = generateRefreshToken({ userId: user._id });
        
        const populatedMemberships = await Promise.all(memberships.map(async (m) => {
            const org = await Organization.findById(m.organizationId).lean();
            return { ...m, organization: org };
        }));

        return { 
            user, 
            accessToken, 
            refreshToken, 
            memberships: populatedMemberships as any,
            organization: populatedMemberships[0]?.organization as any
        };
    }

    // Register new user with default organization
    return await registerOrganization({}, {
        name,
        email,
        isEmailVerified,
        ...providerData
    });
};

/**
 * Google Login
 */
export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            throw new Error('Invalid Google token');
        }

        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        const googleId = payload.sub;

        return await getOrCreateOAuthUser(email, name, { googleId }, payload.email_verified);
    } catch (error) {
        throw new Error('Google authentication failed');
    }
};

/**
 * Apple Login
 */
export const appleLogin = async (idToken: string): Promise<AuthResponse> => {
    try {
        const payload = await appleSignin.verifyIdToken(idToken, {
            audience: process.env.APPLE_CLIENT_ID,
            ignoreExpiration: false,
        });

        if (!payload || !payload.email) {
            throw new Error('Invalid Apple token or email not shared');
        }

        const email = payload.email;
        // Apple only sends name on first login in a separate field, not in token.
        // Frontend should pass name if available, otherwise we use email prefix.
        const name = email.split('@')[0];
        const appleId = payload.sub;

        return await getOrCreateOAuthUser(email, name, { appleId });
    } catch (error) {
        throw new Error('Apple authentication failed');
    }
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
    googleLogin,
    appleLogin,
};

export default authService;
