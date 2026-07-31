import User from '../models/User';
import Organization from '../models/Organization';
import OrganizationMembership from '../models/OrganizationMembership';
import Client from '../models/Client';
import Order from '../models/Order';
import Measurement from '../models/Measurement';
import MeasurementTemplate from '../models/MeasurementTemplate';
import Style from '../models/Style';
import DeviceToken from '../models/DeviceToken';
import Notification from '../models/Notification';
import SubscriptionPayment from '../models/SubscriptionPayment';
import { IUser, PaginationOptions, UserRole } from '../types';
import { sendCredentialsEmail, sendAddedToOrganizationEmail } from '../utils/email';

/**
 * User Service
 * Handles user CRUD operations within an organization
 */

/**
 * Create a new user
 * @param {string} organizationId - Organization ID
 * @param {any} userData - User data
 * @returns {Promise<IUser>} Created user
 */
export const createUser = async (organizationId: string | undefined, userData: any): Promise<IUser> => {
    if (!organizationId) throw new Error('Organization ID is required');

    let user = await User.findOne({ email: userData.email });
    let isNewUser = false;
    let generatedPassword = userData.password;

    if (!user) {
        if (!generatedPassword) {
            generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";
        }
        user = new User({
            ...userData,
            password: generatedPassword,
        });
        await user.save();
        isNewUser = true;
    } else if (userData.role === UserRole.ORG_ADMIN) {
        // If inviting an existing user as an ORG_ADMIN, check if they already are an ORG_ADMIN elsewhere
        const existingAdmin = await OrganizationMembership.findOne({ userId: user._id, role: UserRole.ORG_ADMIN });
        if (existingAdmin) {
            throw new Error('This user already owns or admins another workspace and cannot be made an admin here.');
        }
    }

    // Check if membership already exists
    const existingMembership = await OrganizationMembership.findOne({ userId: user._id, organizationId });
    if (existingMembership) {
        throw new Error('User is already a member of this organization');
    }

    const membership = new OrganizationMembership({
        userId: user._id,
        organizationId,
        role: userData.role || UserRole.STAFF,
        status: 'active'
    });
    await membership.save();

    if (isNewUser) {
        // Create Personal Workspace ONLY if they aren't already being made an ORG_ADMIN of the invited org
        if (userData.role !== UserRole.ORG_ADMIN) {
            const personalOrg = new Organization({
                name: `${user.name.split(' ')[0]}'s Workspace`,
                email: user.email,
                phone: userData.phone || '',
                subscriptionPlan: 'free',
                subscriptionStatus: 'ACTIVE',
            });
            await personalOrg.save();

            const personalMembership = new OrganizationMembership({
                userId: user._id,
                organizationId: personalOrg._id,
                role: UserRole.ORG_ADMIN,
                status: 'active'
            });
            await personalMembership.save();
        }

        // Send credentials email to the new user
        await sendCredentialsEmail(user.email, user.name, generatedPassword);
    } else {
        // Send invitation email
        const org = await Organization.findById(organizationId);
        if (org) {
            await sendAddedToOrganizationEmail(user.email, user.name, org.name);
        }
    }

    return user;
};

/**
 * Get all users in an organization
 * @param {string} organizationId - Organization ID
 * @param {PaginationOptions} options - Pagination options
 * @param {string} search - Search term
 * @returns {Promise<{ users: IUser[], total: number }>} Users and total count
 */
export const getUsers = async (
    globalOrganizationId: string | undefined,
    options: PaginationOptions,
    search: string = '',
    filterOrganizationId: string = '',
    role: string = '',
    isPaginated: boolean = false
): Promise<{ users: any[]; total: number }> => {
    
    const orgId = filterOrganizationId || globalOrganizationId;
    if (!orgId) throw new Error('Organization ID is required');

    const membershipQuery: any = { organizationId: orgId };
    if (role) {
        membershipQuery.role = { $regex: `^${role}$`, $options: 'i' };
    }

    let memberships = await OrganizationMembership.find(membershipQuery).lean();
    const userIds = memberships.map(m => m.userId);

    const userQuery: any = { _id: { $in: userIds } };
    if (search) {
        userQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    let usersQuery = User.find(userQuery).sort({ createdAt: -1 }).lean();

    if (isPaginated) {
        usersQuery = usersQuery.skip(options.skip).limit(options.limit);
    }

    const [users, total] = await Promise.all([
        usersQuery,
        User.countDocuments(userQuery),
    ]);

    // Map memberships onto users
    const mappedUsers = users.map(u => {
        const m = memberships.find(mem => mem.userId === u._id);
        return { ...u, role: m?.role, status: m?.status };
    });

    return { users: mappedUsers, total };
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<IUser>} User
 */
export const getUserById = async (id: string, organizationId: string | undefined): Promise<any> => {
    if (!organizationId) throw new Error('Organization ID is required');

    const membership = await OrganizationMembership.findOne({ userId: id, organizationId }).lean();
    if (!membership) {
        throw new Error('User not found in this organization');
    }
    
    const user = await User.findById(id).lean();

    if (!user) {
        throw new Error('User not found');
    }

    return { ...user, role: membership.role, status: membership.status };
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {string} organizationId - Organization ID
 * @param {any} updateData - Data to update
 * @returns {Promise<IUser>} Updated user
 */
export const updateUser = async (
    id: string,
    organizationId: string | undefined,
    updateData: any
): Promise<any> => {
    // If organizationId is provided, we might be updating the membership role
    if (organizationId && updateData.role) {
        await OrganizationMembership.findOneAndUpdate(
            { userId: id, organizationId },
            { $set: { role: updateData.role } }
        );
    }

    // Remove role from updateData before updating User
    const userUpdate = { ...updateData };
    delete userUpdate.role;

    const user = await User.findOneAndUpdate(
        { _id: id },
        { $set: userUpdate },
        { new: true, runValidators: true }
    ).lean();

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

/**
 * Delete user (Admin deleting staff)
 * @param {string} id - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} Success
 */
export const deleteUser = async (id: string, organizationId: string | undefined): Promise<boolean> => {
    if (!organizationId) throw new Error('Organization ID is required');

    const result = await OrganizationMembership.deleteOne({ userId: id, organizationId });

    if (result.deletedCount === 0) {
        throw new Error('User not found in this organization');
    }

    return true;
};

/**
 * Delete account (User deleting themselves)
 * Cascades if user is ORG_ADMIN
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success
 */
export const deleteAccount = async (userId: string): Promise<boolean> => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const memberships = await OrganizationMembership.find({ userId });
    
    // Find organizations where this user is the only ORG_ADMIN
    for (const membership of memberships) {
        if (membership.role === UserRole.ORG_ADMIN) {
            const adminCount = await OrganizationMembership.countDocuments({ organizationId: membership.organizationId, role: UserRole.ORG_ADMIN });
            if (adminCount <= 1) {
                // Cascading delete for this organization since no other admins exist


                await Promise.all([
                    Client.deleteMany({ organizationId: membership.organizationId }),
                    Order.deleteMany({ organizationId: membership.organizationId }),
                    Measurement.deleteMany({ organizationId: membership.organizationId }),
                    MeasurementTemplate.deleteMany({ organizationId: membership.organizationId }),
                    Style.deleteMany({ organizationId: membership.organizationId }),
                    SubscriptionPayment.deleteMany({ organizationId: membership.organizationId }),
                    OrganizationMembership.deleteMany({ organizationId: membership.organizationId }),
                    Organization.deleteOne({ _id: membership.organizationId }),
                ]);
            }
        }
    }

    // Delete user and their remaining references
    await Promise.all([
        Notification.deleteMany({ userId }),
        DeviceToken.deleteMany({ userId }),
        OrganizationMembership.deleteMany({ userId }),
        User.deleteOne({ _id: userId }),
    ]);

    return true;
};

/**
 * Exit an organization (User leaving an org)
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} Success
 */
export const exitOrganization = async (userId: string, organizationId: string): Promise<boolean> => {
    const membership = await OrganizationMembership.findOne({ userId, organizationId });
    if (!membership) {
        throw new Error('User not found in this organization');
    }

    if (membership.role === UserRole.ORG_ADMIN) {
        const adminCount = await OrganizationMembership.countDocuments({ organizationId, role: UserRole.ORG_ADMIN });
        if (adminCount <= 1) {
            throw new Error('Cannot leave organization. You are the only admin. You must delete the workspace instead or promote someone else to admin first.');
        }
    }

    await OrganizationMembership.deleteOne({ userId, organizationId });
    return true;
};

const userService = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    deleteAccount,
    exitOrganization
};

export default userService;
