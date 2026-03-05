import express from 'express';
import { body } from 'express-validator';
import * as measurementController from '../controllers/measurement.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import validate from '../middlewares/validate.middleware';

import subscriptionMiddleware from '../middlewares/subscription.middleware';

const router = express.Router();

// Apply auth, organization and subscription middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);
router.use(subscriptionMiddleware);


// ==================== TEMPLATES ====================

/**
 * @route   POST /api/v1/measurements/templates
 * @desc    Create measurement template
 * @access  Private
 */
router.post(
    '/templates',
    [
        body('name').trim().notEmpty().withMessage('Template name is required'),
        body('fields').isArray({ min: 1 }).withMessage('At least one field is required'),
        body('fields.*.name').trim().notEmpty().withMessage('Field name is required'),
        validate,
    ],
    measurementController.createTemplate
);

/**
 * @route   GET /api/v1/measurements/templates
 * @desc    Get all templates
 * @access  Private
 */
router.get('/templates', measurementController.getTemplates);

/**
 * @route   GET /api/v1/measurements/templates/:id
 * @desc    Get template by ID
 * @access  Private
 */
router.get('/templates/:id', measurementController.getTemplateById);

/**
 * @route   PUT /api/v1/measurements/templates/:id
 * @desc    Update template
 * @access  Private
 */
router.put(
    '/templates/:id',
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('fields').optional().isArray({ min: 1 }).withMessage('At least one field is required'),
        validate,
    ],
    measurementController.updateTemplate
);

/**
 * @route   DELETE /api/v1/measurements/templates/:id
 * @desc    Delete template
 * @access  Private
 */
router.delete('/templates/:id', measurementController.deleteTemplate);

// ==================== MEASUREMENTS ====================

/**
 * @route   POST /api/v1/measurements
 * @desc    Create measurement record
 * @access  Private
 */
router.post(
    '/',
    [
        body('clientId').notEmpty().withMessage('Client ID is required'),
        body('templateId').notEmpty().withMessage('Template ID is required'),
        body('values').isObject().withMessage('Values must be an object'),
        validate,
    ],
    measurementController.createMeasurement
);

/**
 * @route   GET /api/v1/measurements
 * @desc    Get all measurements
 * @access  Private
 */
router.get('/', measurementController.getMeasurements);

/**
 * @route   GET /api/v1/measurements/client/:clientId
 * @desc    Get measurements by client
 * @access  Private
 */
router.get('/client/:clientId', measurementController.getMeasurementsByClient);

/**
 * @route   GET /api/v1/measurements/:id
 * @desc    Get measurement by ID
 * @access  Private
 */
router.get('/:id', measurementController.getMeasurementById);

/**
 * @route   PUT /api/v1/measurements/:id
 * @desc    Update measurement
 * @access  Private
 */
router.put(
    '/:id',
    [
        body('values').optional().isObject().withMessage('Values must be an object'),
        validate,
    ],
    measurementController.updateMeasurement
);

/**
 * @route   DELETE /api/v1/measurements/:id
 * @desc    Delete measurement
 * @access  Private
 */
router.delete('/:id', measurementController.deleteMeasurement);

export default router;
