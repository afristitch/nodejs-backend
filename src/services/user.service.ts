import User from '../models/User';
import { IUser, PaginationOptions } from '../types';
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
export const createUser = async (organizationId: string, userData: any): Promise<IUser> => {
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
    organizationId: string,
    options: PaginationOptions,
    search: string = ''
): Promise<{ users: IUser[]; total: number }> => {
    const query: any = { organizationId };

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .sort({ createdAt: -1 })
            .skip(options.skip)
            .limit(options.limit),
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
export const getUserById = async (id: string, organizationId: string): Promise<IUser> => {
    const user = await User.findOne({ _id: id, organizationId });

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
    organizationId: string,
    updateData: any
): Promise<IUser> => {
    const user = await User.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

/**
 * Delete user
 * @param {string} id - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} Success
 */
export const deleteUser = async (id: string, organizationId: string): Promise<boolean> => {
    const result = await User.deleteOne({ _id: id, organizationId });

    if (result.deletedCount === 0) {
        throw new Error('User not found');
    }

    return true;
};

const userService = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
};

export default userService;
