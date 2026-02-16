import MeasurementTemplate from '../models/MeasurementTemplate';
import Measurement from '../models/Measurement';
import { IMeasurementTemplate, IMeasurement, PaginationOptions } from '../types';

/**
 * Measurement Service
 * Handles measurement templates and measurement records
 */

// ==================== TEMPLATES ====================

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
    const filter: any = { organizationId };

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
    const template = await MeasurementTemplate.findOne({ _id: id, organizationId });

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
    const template = await MeasurementTemplate.findOneAndUpdate(
        { _id: id, organizationId },
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
    const result = await MeasurementTemplate.deleteOne({ _id: id, organizationId });

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
    const [measurements, total] = await Promise.all([
        Measurement.find({ organizationId })
            .sort({ createdAt: -1 })
            .skip(options.skip)
            .limit(options.limit)
            .populate('clientId', 'name phone')
            .populate('templateId', 'name'),
        Measurement.countDocuments({ organizationId }),
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
