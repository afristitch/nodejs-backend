import express from 'express';
import { body } from 'express-validator';
import * as orderController from '../controllers/order.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';

const router = express.Router();

// Apply auth and organization middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post(
    '/',
    [
        body('clientId').notEmpty().withMessage('Client ID is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('status')
            .optional()
            .isIn(['pending', 'in-progress', 'fitting', 'completed', 'delivered'])
            .withMessage('Invalid status'),
        body('clothImageUrl')
            .optional()
            .isURL()
            .withMessage('Cloth image URL must be a valid URL'),
        body('clothSize')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Cloth size must be a string of at most 100 characters'),
        validate,
    ],
    orderController.createOrder
);

/**
 * @route   GET /api/v1/orders
 * @desc    Get all orders (with filters and pagination)
 * @access  Private
 */
router.get('/', orderController.getOrders);

/**
 * @route   GET /api/v1/orders/reports/financial
 * @desc    Get financial summary (ADMIN only)
 * @access  Private (ORG_ADMIN)
 */
router.get('/reports/financial', requireAdmin, orderController.getFinancialSummary);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', orderController.getOrderById);

/**
 * @route   PUT /api/v1/orders/:id
 * @desc    Update order
 * @access  Private
 */
router.put(
    '/:id',
    [
        body('amount').optional().isNumeric().withMessage('Amount must be a number'),
        body('status')
            .optional()
            .isIn(['pending', 'in-progress', 'fitting', 'completed', 'delivered'])
            .withMessage('Invalid status'),
        body('clothImageUrl')
            .optional()
            .isURL()
            .withMessage('Cloth image URL must be a valid URL'),
        body('clothSize')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Cloth size must be a string of at most 100 characters'),
        validate,
    ],
    orderController.updateOrder
);

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private
 */
router.patch(
    '/:id/status',
    [
        body('status')
            .isIn(['pending', 'in-progress', 'fitting', 'completed', 'delivered'])
            .withMessage('Invalid status'),
        validate,
    ],
    orderController.updateOrderStatus
);

/**
 * @route   PATCH /api/v1/orders/:id/payment
 * @desc    Record payment
 * @access  Private
 */
router.patch(
    '/:id/payment',
    [
        body('amount').isNumeric().withMessage('Amount must be a number'),
        validate,
    ],
    orderController.recordPayment
);

/**
 * @route   DELETE /api/v1/orders/:id
 * @desc    Delete order
 * @access  Private
 */
router.delete('/:id', orderController.deleteOrder);

export default router;
