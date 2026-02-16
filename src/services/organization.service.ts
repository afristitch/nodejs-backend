import Organization from '../models/Organization';
import { IOrganization } from '../types';

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

const organizationService = {
    getOrganizationById,
    updateOrganization,
};

export default organizationService;
