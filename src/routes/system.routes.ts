import express from 'express';
import * as systemController from '../controllers/system.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';

const router = express.Router();

// Apply auth and admin middleware to all system routes
router.use(authMiddleware);
router.use(requireSuperAdmin);

/**
 * @route   GET /api/v1/system/logs
 * @desc    Get all log files
 * @access  Private (Admin only)
 */
router.get('/logs', systemController.getLogFiles);

/**
 * @route   GET /api/v1/system/logs/:filename
 * @desc    Get specific log file content
 * @access  Private (Admin only)
 */
router.get('/logs/:filename', systemController.getLogFileContent);

export default router;
