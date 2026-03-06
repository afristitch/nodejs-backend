import express from 'express';
import { body } from 'express-validator';
import * as clientController from '../controllers/client.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import validate from '../middlewares/validate.middleware';

import subscriptionMiddleware from '../middlewares/subscription.middleware';

const router = express.Router();

// Apply auth, organization and subscription middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);
router.use(subscriptionMiddleware);


/**
 * @route   POST /api/v1/clients
 * @desc    Create a new client
 * @access  Private
 */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Client name is required'),
        body('phone').trim().notEmpty().withMessage('Phone number is required'),
        body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
        validate,
    ],
    clientController.createClient
);

/**
 * @route   GET /api/v1/clients
 * @desc    Get all clients (with search and pagination)
 * @access  Private
 */
router.get('/', clientController.getClients);

/**
 * @route   GET /api/v1/clients/:id
 * @desc    Get client by ID
 * @access  Private
 */
router.get('/:id', clientController.getClientById);

/**
 * @route   PUT /api/v1/clients/:id
 * @desc    Update client
 * @access  Private
 */
router.put(
    '/:id',
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
        body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
        validate,
    ],
    clientController.updateClient
);

/**
 * @route   DELETE /api/v1/clients/:id
 * @desc    Delete client (soft delete)
 * @access  Private
 */
router.delete('/:id', clientController.deleteClient);

export default router;
