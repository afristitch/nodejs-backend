import User from '../models/User';
import Organization from '../models/Organization';
import Client from '../models/Client';
import Order from '../models/Order';
import Measurement from '../models/Measurement';
import MeasurementTemplate from '../models/MeasurementTemplate';
import Style from '../models/Style';
import DeviceToken from '../models/DeviceToken';
import Notification from '../models/Notification';
import SubscriptionPayment from '../models/SubscriptionPayment';
import { IUser, PaginationOptions, UserRole } from '../types';
import { sendCredentialsEmail } from '../utils/email';

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
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    const user = new User({
        ...userData,
        organizationId,
    });

    await user.save();

    // Send credentials email to the new user
    // We pass the raw password from userData before it was hashed in the model pre-save hook
    await sendCredentialsEmail(user.email, user.name, userData.password);

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
): Promise<{ users: IUser[]; total: number }> => {
    const query: any = globalOrganizationId ? { organizationId: globalOrganizationId } : {};

    if (filterOrganizationId && !globalOrganizationId) {
        query.organizationId = filterOrganizationId;
    }

    if (role) {
        query.role = { $regex: `^${role}$`, $options: 'i' };
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    let usersQuery = User.find(query).sort({ createdAt: -1 });

    if (isPaginated) {
        usersQuery = usersQuery.skip(options.skip).limit(options.limit);
    }

    const [users, total] = await Promise.all([
        usersQuery,
        User.countDocuments(query),
    ]);

    return { users, total };
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<IUser>} User
 */
export const getUserById = async (id: string, organizationId: string | undefined): Promise<IUser> => {
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;
    
    const user = await User.findOne(query);

    if (!user) {
        throw new Error('User not found');
    }

    return user;
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
): Promise<IUser> => {
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const user = await User.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
    );

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
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const result = await User.deleteOne(query);

    if (result.deletedCount === 0) {
        throw new Error('User not found');
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

    const { organizationId, role } = user;

    if (role === UserRole.ORG_ADMIN) {
        // Find all users in the organization to delete their tokens/notifications
        const orgUsers = await User.find({ organizationId });
        const orgUserIds = orgUsers.map(u => u._id);

        // Delete all data associated with the organization
        await Promise.all([
            Client.deleteMany({ organizationId }),
            Order.deleteMany({ organizationId }),
            Measurement.deleteMany({ organizationId }),
            MeasurementTemplate.deleteMany({ organizationId }),
            Style.deleteMany({ organizationId }),
            SubscriptionPayment.deleteMany({ organizationId }),
            Notification.deleteMany({ userId: { $in: orgUserIds } }),
            DeviceToken.deleteMany({ userId: { $in: orgUserIds } }),
            User.deleteMany({ organizationId }),
            Organization.deleteOne({ _id: organizationId }),
        ]);
    } else {
        // STAFF member - only delete their own data
        await Promise.all([
            Notification.deleteMany({ userId }),
            DeviceToken.deleteMany({ userId }),
            User.deleteOne({ _id: userId }),
        ]);
    }

    return true;
};

const userService = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    deleteAccount,
};

export default userService;
