import { Response, NextFunction } from "express";
import profileService from "../services/profile.service";
import { successResponse } from "../utils/response";
import { AuthRequest, IUser } from "../types";
import User from "../models/User";

/**
 * GET /api/v1/profile/me
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await profileService.getMyProfile(req.user);
    return successResponse(res, result, "Profile fetched successfully"); // add return
  } catch (error) {
    return next(error); // add return
  }
};


/**
 * PUT /api/v1/profile/me
 * Update current user's profile (name, email, photo)
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { name, email, photoUrl } = req.body as Partial<IUser>;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, photoUrl },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove sensitive fields manually just in case
    const userSafe = updatedUser.toObject() as any;
    delete userSafe.password;
    delete userSafe.passwordResetToken;
    delete userSafe.passwordResetExpires;

    return successResponse(res, userSafe, "Profile updated successfully");
  } catch (error) {
    return next(error);
  }
};

