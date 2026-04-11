import express from 'express';
import * as systemController from '../controllers/system.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';

const router = express.Router();

/**
 * @route   GET /api/v1/system/maintenance
 * @desc    Get maintenance status (Public)
 * @access  Public
 */
router.get('/maintenance', systemController.getMaintenanceStatus);

// Apply auth and admin middleware to remaining system routes
router.use(authMiddleware);
router.use(requireSuperAdmin);

/**
 * @route   PATCH /api/v1/system/maintenance
 * @desc    Update maintenance status
 * @access  Private (SuperAdmin only)
 */
router.patch('/maintenance', systemController.updateMaintenanceStatus);

/**
 * @route   PATCH /api/v1/system/versions
 * @desc    Update app versions and notify users
 * @access  Private (SuperAdmin only)
 */
router.patch('/versions', systemController.updateAppVersions);

/**
 * @route   GET /api/v1/system/logs
 * @desc    Get all log files
 * @access  Private (Admin only)
 */
router.get('/logs', systemController.getLogFiles);

router.get('/logs/:filename', systemController.getLogFileContent);

/**
 * @route   GET /api/v1/system/health/settings
 * @desc    Get platform monitoring settings
 * @access  Private (Admin only)
 */
router.get('/health/settings', systemController.getHealthSettings);

/**
 * @route   PATCH /api/v1/system/health/settings
 * @desc    Update platform monitoring settings
 * @access  Private (Admin only)
 */
router.patch('/health/settings', systemController.updateHealthSettings);

export default router;
