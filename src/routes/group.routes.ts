import express from 'express';
import { body } from 'express-validator';
import * as groupController from '../controllers/group.controller';
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
 * @route   POST /api/v1/groups
 * @desc    Create a new group
 * @access  Private
 */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Group name is required'),
        body('description').optional().trim(),
        validate,
    ],
    groupController.createGroup
);

/**
 * @route   GET /api/v1/groups
 * @desc    Get all groups (with search and pagination)
 * @access  Private
 */
router.get('/', groupController.getGroups);

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
router.get('/:id', groupController.getGroupById);

/**
 * @route   PUT /api/v1/groups/:id
 * @desc    Update group
 * @access  Private
 */
router.put(
    '/:id',
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('description').optional().trim(),
        validate,
    ],
    groupController.updateGroup
);

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete group (soft delete)
 * @access  Private
 */
router.delete('/:id', groupController.deleteGroup);

// ─── Member Routes ──────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/groups/:id/members
 * @desc    Get group members
 * @access  Private
 */
router.get('/:id/members', groupController.getMembers);

/**
 * @route   POST /api/v1/groups/:id/members
 * @desc    Add member to group
 * @access  Private
 */
router.post(
    '/:id/members',
    [
        body('clientId').trim().notEmpty().withMessage('Client ID is required'),
        validate,
    ],
    groupController.addMember
);

/**
 * @route   DELETE /api/v1/groups/:id/members/:memberId
 * @desc    Remove member from group
 * @access  Private
 */
router.delete('/:id/members/:memberId', groupController.removeMember);

export default router;
