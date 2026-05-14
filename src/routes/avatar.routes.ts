import express from 'express';
import * as avatarController from '../controllers/avatar.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types';

const router = express.Router();

/**
 * @route   GET /api/v1/avatars
 * @desc    Get all active bitmoji avatars
 * @access  Private (Authenticated users)
 */
router.get('/', authMiddleware, avatarController.getAvatars);

/**
 * @route   POST /api/v1/avatars
 * @desc    Create a new avatar preset
 * @access  Private/Superadmin
 */
router.post('/', authMiddleware, authorize(UserRole.SUPER_ADMIN), avatarController.createAvatar);

/**
 * @route   PATCH /api/v1/avatars/:id
 * @desc    Update an avatar preset
 * @access  Private/Superadmin
 */
router.patch('/:id', authMiddleware, authorize(UserRole.SUPER_ADMIN), avatarController.updateAvatar);

/**
 * @route   DELETE /api/v1/avatars/:id
 * @desc    Delete an avatar preset
 * @access  Private/Superadmin
 */
router.delete('/:id', authMiddleware, authorize(UserRole.SUPER_ADMIN), avatarController.deleteAvatar);

export default router;
