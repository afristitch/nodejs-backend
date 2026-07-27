import express from 'express';
import { proformaController } from '../controllers/proforma.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';

const router = express.Router();

// Apply auth and organization middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * @route   POST /api/v1/proforma
 * @desc    Create a new proforma invoice
 * @access  Private
 */
router.post('/', proformaController.create as any);

/**
 * @route   GET /api/v1/proforma
 * @desc    Get all proforma invoices for the organization
 * @access  Private
 */
router.get('/', proformaController.getAll as any);

/**
 * @route   GET /api/v1/proforma/:id
 * @desc    Get a single proforma invoice by ID
 * @access  Private
 */
router.get('/:id', proformaController.getById as any);

/**
 * @route   PUT /api/v1/proforma/:id
 * @desc    Update a proforma invoice
 * @access  Private
 */
router.put('/:id', proformaController.update as any);

/**
 * @route   DELETE /api/v1/proforma/:id
 * @desc    Delete a proforma invoice
 * @access  Private
 */
router.delete('/:id', proformaController.delete as any);

export default router;
