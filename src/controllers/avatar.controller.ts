import { Request, Response, NextFunction } from 'express';
import Avatar from '../models/Avatar';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../types';

/**
 * @desc    Get all active avatars
 * @route   GET /api/v1/avatars
 * @access  Public (or Auth)
 */
export const getAvatars = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const avatars = await Avatar.find({ isActive: true }).sort({ createdAt: -1 });
    return successResponse(res, avatars, "Avatars fetched successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Create a new avatar (Superadmin only)
 * @route   POST /api/v1/avatars
 * @access  Private/Superadmin
 */
export const createAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, url, category, isActive } = req.body;
    const avatar = await Avatar.create({ name, url, category, isActive });
    return successResponse(res, avatar, "Avatar created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Update an avatar
 * @route   PATCH /api/v1/avatars/:id
 * @access  Private/Superadmin
 */
export const updateAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const avatar = await Avatar.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!avatar) {
      return res.status(404).json({ message: "Avatar not found" });
    }
    return successResponse(res, avatar, "Avatar updated successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Delete an avatar
 * @route   DELETE /api/v1/avatars/:id
 * @access  Private/Superadmin
 */
export const deleteAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const avatar = await Avatar.findByIdAndDelete(id);
    if (!avatar) {
      return res.status(404).json({ message: "Avatar not found" });
    }
    return successResponse(res, null, "Avatar deleted successfully");
  } catch (error) {
    return next(error);
  }
};
