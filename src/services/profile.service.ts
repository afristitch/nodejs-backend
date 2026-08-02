import Organization from "../models/Organization";
import Client from "../models/Client";
import Order from "../models/Order";
import { IUser } from "../types";
import User from '../models/User';


export const getMyProfile = async (user: IUser, organizationId?: string) => {

  // 1️⃣ Get organization
  let organization = null;
  if (organizationId) {
    organization = await Organization.findById(organizationId);
  }

  if (!organization) {
    return {
      user,
      organization: null,
      memberships: [],
      summary: { totalOrders: 0, totalRevenue: 0 },
      weekly: { orders: [], totalRevenue: 0 },
      recentClients: [],
    };
  }

  // 2️⃣ Total summary
  const totalSummary = await Order.aggregate([
    { $match: { organizationId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  const summary = totalSummary[0] || {
    totalOrders: 0,
    totalRevenue: 0,
  };

  // 3️⃣ Weekly orders
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyOrders = await Order.find({
    organizationId,
    createdAt: { $gte: startOfWeek },
  }).sort({ createdAt: -1 });

  const weeklyRevenue = weeklyOrders.reduce((acc, order) => acc + order.amount, 0);

  // 4️⃣ 5 most recent clients
  const recentClients = await Client.find({
    organizationId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(5);

  const OrganizationMembership = (await import('../models/OrganizationMembership')).default;
  const memberships = await OrganizationMembership.find({ userId: user._id, status: 'active' }).lean();
  const populatedMemberships = await Promise.all(memberships.map(async (m) => {
      const org = await Organization.findById(m.organizationId).lean();
      return { ...m, organization: org };
  }));

  return {
    user, // already sanitized via toJSON
    organization,
    memberships: populatedMemberships as any,
    summary,
    weekly: {
      orders: weeklyOrders,
      totalRevenue: weeklyRevenue,
    },
    recentClients,
  };
};


/**
 * Update current user's profile (name, email, photo)
 * @param user - The authenticated user
 * @param payload - Partial fields to update
 * @returns The updated user object (sanitized)
 */
export const updateMyProfile = async (
  user: IUser,
  payload: Partial<Pick<IUser, 'name' | 'email' | 'photoUrl'>>
) => {
  const { name, email, photoUrl } = payload;

  // Find the user by ID and update
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { name, email, photoUrl },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new Error('User not found');
  }

  // Return sanitized user
  return updatedUser.toJSON();
};

export default {
  getMyProfile,
  updateMyProfile,
};
