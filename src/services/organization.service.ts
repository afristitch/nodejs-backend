import Organization from '../models/Organization';
import { IOrganization, PaginationOptions } from '../types';

/**
 * Organization Service
 * Handles organization-level operations
 */

/**
 * Get organization by ID
 */
export const getOrganizationById = async (id: string): Promise<IOrganization> => {
    const organization = await Organization.findById(id);

    if (!organization) {
        throw new Error('Organization not found');
    }

    return organization;
};

/**
 * Update organization
 */
export const updateOrganization = async (
    id: string,
    updateData: any
): Promise<IOrganization> => {
    const organization = await Organization.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!organization) {
        throw new Error('Organization not found');
    }

    return organization;
};

/**
 * Get all organizations (SUPER_ADMIN only)
 */
export const getOrganizations = async (
    options: PaginationOptions,
    search: string = '',
    status: string = '',
    isPaginated: boolean = false
): Promise<{ organizations: IOrganization[]; total: number }> => {
    const query: any = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    
    if (status) {
        const now = new Date();
        const statusLower = status.toLowerCase();

        if (statusLower === 'expired') {
            // Include both explicitly expired and trials that have ended
            query.$or = [
                { subscriptionStatus: { $regex: '^expired$', $options: 'i' } },
                { 
                    subscriptionStatus: { $regex: '^trialing$', $options: 'i' },
                    subscriptionEndsAt: { $lt: now }
                }
            ];
        } else if (statusLower === 'trialing') {
            // Only include trials that haven't ended yet
            query.subscriptionStatus = { $regex: '^trialing$', $options: 'i' };
            query.$or = [
                { subscriptionEndsAt: { $exists: false } },
                { subscriptionEndsAt: { $gte: now } }
            ];
        } else {
            query.subscriptionStatus = { $regex: `^${status}$`, $options: 'i' };
        }
    }

    let orgsQuery = Organization.find(query).sort({ createdAt: -1 });

    if (isPaginated) {
        orgsQuery = orgsQuery.skip(options.skip).limit(options.limit);
    }

    const [organizations, total] = await Promise.all([
        orgsQuery,
        Organization.countDocuments(query),
    ]);

    return { organizations, total };
};

/**
 * Delete organization
 */
export const deleteOrganization = async (id: string): Promise<void> => {
    const organization = await Organization.findByIdAndDelete(id);

    if (!organization) {
        throw new Error('Organization not found');
    }
};

const organizationService = {
    getOrganizationById,
    updateOrganization,
    getOrganizations,
    deleteOrganization,
};

export default organizationService;
