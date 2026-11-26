import express from 'express';
import { body } from 'express-validator';
import * as inventoryController from '../controllers/inventory.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { requirePremium } from '../middlewares/subscription.middleware';
import validate from '../middlewares/validate.middleware';

const router = express.Router();

// All inventory routes require authentication, workspace context, and an active Pro plan
router.use(authMiddleware);
router.use(organizationMiddleware);
router.use(requirePremium);

const CATEGORIES = ['fabric', 'trim', 'tool', 'finished', 'other'];
const UNITS = ['yards', 'meters', 'pieces', 'rolls', 'packs'];
const REASONS = ['initial', 'restock', 'used', 'damaged', 'correction'];

/**
 * @route   GET /api/v1/inventory
 * @desc    List inventory items (Admin & Staff)
 */
router.get('/', inventoryController.getInventoryItems);

/**
 * @route   GET /api/v1/inventory/:id
 * @desc    Get single inventory item and stock history (Admin & Staff)
 */
router.get('/:id', inventoryController.getInventoryItemById);

/**
 * @route   POST /api/v1/inventory
 * @desc    Create a new inventory item (Admin only)
 */
router.post(
    '/',
    requireAdmin,
    [
        body('name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 120 }),
        body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
        body('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
        body('unit').optional().isIn(UNITS).withMessage('Invalid unit'),
        body('lowStockThreshold').optional().isNumeric().withMessage('Threshold must be a number'),
        validate,
    ],
    inventoryController.createInventoryItem
);

/**
 * @route   PUT /api/v1/inventory/:id
 * @desc    Update inventory item metadata (Admin only)
 */
router.put(
    '/:id',
    requireAdmin,
    [
        body('name').optional().trim().notEmpty().isLength({ max: 120 }),
        body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
        body('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
        body('unit').optional().isIn(UNITS).withMessage('Invalid unit'),
        body('lowStockThreshold').optional().isNumeric().withMessage('Threshold must be a number'),
        validate,
    ],
    inventoryController.updateInventoryItem
);

/**
 * @route   PATCH /api/v1/inventory/:id/adjust
 * @desc    Adjust stock quantity with audit log (Admin & Staff)
 */
router.patch(
    '/:id/adjust',
    [
        body('reason').optional().isIn(REASONS).withMessage('Invalid adjustment reason'),
        body('delta').optional().isNumeric().withMessage('Delta must be a number'),
        body('newQuantity').optional().isNumeric().withMessage('New quantity must be a number'),
        validate,
    ],
    inventoryController.adjustInventoryStock
);

/**
 * @route   DELETE /api/v1/inventory/:id
 * @desc    Delete inventory item (Admin only)
 */
router.delete('/:id', requireAdmin, inventoryController.deleteInventoryItem);

export default router;
