import { FilterQuery } from 'mongoose';
import Style from '../models/Style';
import { IStyle, PaginatedResponse, PaginationMeta, PaginationOptions, StyleGender } from '../types';

/**
 * Style Service
 * Handles business logic for style gallery
 */

/**
 * Create a new style
 */
export const createStyle = async (data: Partial<IStyle>): Promise<IStyle> => {
    const style = new Style(data);
    await style.save();
    return style;
};

/**
 * Get all styles for an organization with pagination
 */
export const getStyles = async (
    organizationId: string,
    options: PaginationOptions,
    filters: { gender?: StyleGender; search?: string; onlyOrg?: boolean } = {}
): Promise<PaginatedResponse<IStyle>> => {
    // Return styles that are either global (null) or belong to this organization
    const query: FilterQuery<IStyle> = filters.onlyOrg
        ? { organizationId: organizationId }
        : {
            $or: [
                { organizationId: organizationId },
                { organizationId: null }
            ]
        };

    if (filters.gender) {
        query.gender = filters.gender;
    }

    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    const total = await Style.countDocuments(query);
    const styles = await Style.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit);

    const totalPages = Math.ceil(total / options.limit);

    const pagination: PaginationMeta = {
        total,
        page: options.page,
        limit: options.limit,
        totalPages,
        hasNextPage: options.page < totalPages,
        hasPrevPage: options.page > 1,
    };

    return {
        data: styles,
        pagination,
    };
};

/**
 * Get a single style by ID
 */
export const getStyleById = async (styleId: string, organizationId: string): Promise<IStyle | null> => {
    return await Style.findOne({
        _id: styleId,
        $or: [{ organizationId }, { organizationId: null }],
    });
};

/**
 * Update a style
 */
export const updateStyle = async (
    styleId: string,
    organizationId: string,
    updateData: Partial<IStyle>
): Promise<IStyle | null> => {
    return await Style.findOneAndUpdate(
        { _id: styleId, organizationId },
        { $set: updateData },
        { new: true, runValidators: true }
    );
};

/**
 * Delete a style
 */
export const deleteStyle = async (styleId: string, organizationId: string): Promise<boolean> => {
    const result = await Style.deleteOne({ _id: styleId, organizationId });
    return result.deletedCount > 0;
};

const styleService = {
    createStyle,
    getStyles,
    getStyleById,
    updateStyle,
    deleteStyle,
};

export default styleService;
