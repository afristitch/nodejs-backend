import MeasurementTemplate from '../models/MeasurementTemplate';
import Measurement from '../models/Measurement';
import { IMeasurementTemplate, IMeasurement, PaginationOptions } from '../types';
import { SYSTEM_ORG_ID, DEFAULT_TEMPLATES } from '../config/constants';

/**
 * Measurement Service
 * Handles measurement templates and measurement records
 */

// ==================== TEMPLATES ====================

/**
 * Seed global measurement templates
 */
export const seedGlobalTemplates = async (userId: string = 'SYSTEM'): Promise<void> => {
    for (const templateData of DEFAULT_TEMPLATES) {
        const existingTemplate = await MeasurementTemplate.findOne({
            name: templateData.name,
            organizationId: SYSTEM_ORG_ID
        });

        if (!existingTemplate) {
            await MeasurementTemplate.create({
                ...templateData,
                organizationId: SYSTEM_ORG_ID,
                createdBy: userId
            });
            console.log(`Global template created: ${templateData.name}`);
        } else {
            // Update iconUrl if it's missing or different
            if (existingTemplate.iconUrl !== (templateData as any).iconUrl) {
                existingTemplate.iconUrl = (templateData as any).iconUrl;
                await existingTemplate.save();
                console.log(`Global template updated: ${templateData.name} (iconUrl)`);
            }
        }
    }
};

/**
 * Create a new measurement template
 */
export const createTemplate = async (
    organizationId: string,
    templateData: any,
    userId: string
): Promise<IMeasurementTemplate> => {
    const template = new MeasurementTemplate({
        ...templateData,
        organizationId,
        createdBy: userId,
    });

    await template.save();
    return template;
};

/**
 * Get all measurement templates in an organization
 */
export const getTemplates = async (
    organizationId: string,
    options: PaginationOptions,
    query: any = {}
): Promise<{ templates: IMeasurementTemplate[]; total: number }> => {
    const filter: any = {};
    if (organizationId) {
        filter.$or = [
            { organizationId },
            { organizationId: SYSTEM_ORG_ID }
        ];
    }

    if (query.search) {
        filter.name = { $regex: query.search, $options: 'i' };
    }

    const [templates, total] = await Promise.all([
        MeasurementTemplate.find(filter)
            .sort({ name: 1 })
            .skip(options.skip)
            .limit(options.limit),
        MeasurementTemplate.countDocuments(filter),
    ]);

    return { templates, total };
};

/**
 * Get template by ID
 */
export const getTemplateById = async (
    id: string,
    organizationId: string
): Promise<IMeasurementTemplate> => {
    const query: any = { _id: id };
    if (organizationId) {
        query.$or = [
            { organizationId },
            { organizationId: SYSTEM_ORG_ID }
        ];
    }
    const template = await MeasurementTemplate.findOne(query);

    if (!template) {
        throw new Error('Template not found');
    }

    return template;
};

/**
 * Update template
 */
export const updateTemplate = async (
    id: string,
    organizationId: string,
    updateData: any
): Promise<IMeasurementTemplate> => {
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const template = await MeasurementTemplate.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!template) {
        throw new Error('Template not found');
    }

    return template;
};

/**
 * Delete template
 */
export const deleteTemplate = async (id: string, organizationId: string): Promise<boolean> => {
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const result = await MeasurementTemplate.deleteOne(query);

    if (result.deletedCount === 0) {
        throw new Error('Template not found');
    }

    return true;
};

// ==================== MEASUREMENTS ====================

/**
 * Create a measurement record
 */
export const createMeasurement = async (
    organizationId: string,
    measurementData: any,
    userId: string
): Promise<IMeasurement> => {
    const measurement = new Measurement({
        ...measurementData,
        organizationId,
        createdBy: userId,
    });

    await measurement.save();
    return measurement;
};

/**
 * Get all measurements in an organization
 */
export const getMeasurements = async (
    organizationId: string,
    options: PaginationOptions
): Promise<{ measurements: IMeasurement[]; total: number }> => {
    const query: any = organizationId ? { organizationId } : {};
    
    const [measurements, total] = await Promise.all([
        Measurement.find(query)
            .sort({ createdAt: -1 })
            .skip(options.skip)
            .limit(options.limit)
            .populate('clientId', 'name phone')
            .populate('templateId', 'name'),
        Measurement.countDocuments(query),
    ]);

    return { measurements, total };
};

/**
 * Get measurements by client ID
 */
export const getMeasurementsByClient = async (
    clientId: string,
    organizationId: string
): Promise<IMeasurement[]> => {
    return Measurement.find({ clientId, organizationId })
        .sort({ createdAt: -1 })
        .populate('templateId', 'name');
};

/**
 * Get measurement by ID
 */
export const getMeasurementById = async (
    id: string,
    organizationId: string
): Promise<IMeasurement> => {
    const measurement = await Measurement.findOne({ _id: id, organizationId })
        .populate('clientId', 'name phone')
        .populate('templateId', 'name');

    if (!measurement) {
        throw new Error('Measurement not found');
    }

    return measurement;
};

/**
 * Update measurement
 */
export const updateMeasurement = async (
    id: string,
    organizationId: string,
    updateData: any
): Promise<IMeasurement> => {
    const measurement = await Measurement.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!measurement) {
        throw new Error('Measurement not found');
    }

    return measurement;
};

/**
 * Delete measurement
 */
export const deleteMeasurement = async (id: string, organizationId: string): Promise<boolean> => {
    const result = await Measurement.deleteOne({ _id: id, organizationId });

    if (result.deletedCount === 0) {
        throw new Error('Measurement not found');
    }

    return true;
};

const measurementService = {
    // Templates
    seedGlobalTemplates,
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    // Measurements
    createMeasurement,
    getMeasurements,
    getMeasurementsByClient,
    getMeasurementById,
    updateMeasurement,
    deleteMeasurement,
};

export default measurementService;
