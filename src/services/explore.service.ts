import Organization from '../models/Organization';
import { IOrganization, PaginationOptions } from '../types';

/**
 * Explore Service
 * Handles discovery and public profile operations
 */

/**
 * Get all public tailors with filtering and search
 */
export const getPublicTailors = async (
    options: PaginationOptions,
    search: string = '',
    specialty: string = '',
    location: string = ''
): Promise<{ tailors: IOrganization[]; total: number }> => {
    const query: any = { isPublic: true };
    
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    
    if (specialty && specialty !== 'All') {
        query.specialties = { $in: [specialty] };
    }
    
    if (location) {
        query.address = { $regex: location, $options: 'i' };
    }

    const [tailors, total] = await Promise.all([
        Organization.find(query)
            .sort({ rating: -1, createdAt: -1 })
            .skip(options.skip)
            .limit(options.limit),
        Organization.countDocuments(query),
    ]);

    return { tailors, total };
};

/**
 * Get a public tailor by ID
 */
export const getPublicTailorById = async (id: string): Promise<IOrganization> => {
    const tailor = await Organization.findOne({ _id: id, isPublic: true });

    if (!tailor) {
        throw new Error('Studio not found or is not public');
    }

    return tailor;
};

const exploreService = {
    getPublicTailors,
    getPublicTailorById,
};

export default exploreService;
