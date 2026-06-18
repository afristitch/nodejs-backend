import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import Client from '../models/Client';
import { IGroup, IGroupMember } from '../types/group';
import { PaginationOptions } from '../types';

/**
 * Group Service
 * Handles group and group member business logic
 */

/**
 * Create a new group
 */
export const createGroup = async (
    organizationId: string,
    data: { name: string; description?: string },
    userId: string
): Promise<IGroup> => {
    const group = new Group({
        ...data,
        organizationId,
        createdBy: userId,
    });
    await group.save();
    return group;
};

/**
 * Get all groups in an organization
 */
export const getGroups = async (
    organizationId: string,
    options: PaginationOptions,
    search: string = ''
): Promise<{ groups: any[]; total: number }> => {
    const query: any = { organizationId, isDeleted: false };

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const [groups, total] = await Promise.all([
        Group.find(query)
            .sort({ createdAt: -1 })
            .skip(options.skip)
            .limit(options.limit)
            .lean(),
        Group.countDocuments(query),
    ]);

    // Attach member counts
    const groupIds = groups.map(g => g._id);
    const memberCounts = await GroupMember.aggregate([
        { $match: { groupId: { $in: groupIds } } },
        { $group: { _id: '$groupId', count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    memberCounts.forEach(mc => { countMap[mc._id] = mc.count; });

    const enriched = groups.map(g => ({
        ...g,
        memberCount: countMap[g._id] || 0,
    }));

    return { groups: enriched, total };
};

/**
 * Get group by ID
 */
export const getGroupById = async (
    id: string,
    organizationId: string
): Promise<any> => {
    const group = await Group.findOne({ _id: id, organizationId, isDeleted: false }).lean();
    if (!group) throw new Error('Group not found');

    const memberCount = await GroupMember.countDocuments({ groupId: id });
    return { ...group, memberCount };
};

/**
 * Update group
 */
export const updateGroup = async (
    id: string,
    organizationId: string,
    data: Partial<{ name: string; description: string }>
): Promise<IGroup> => {
    const group = await Group.findOneAndUpdate(
        { _id: id, organizationId, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true }
    );
    if (!group) throw new Error('Group not found');
    return group;
};

/**
 * Delete group (soft delete)
 */
export const deleteGroup = async (id: string, organizationId: string): Promise<boolean> => {
    const group = await Group.findOneAndUpdate(
        { _id: id, organizationId, isDeleted: false },
        { $set: { isDeleted: true } }
    );
    if (!group) throw new Error('Group not found');
    return true;
};

// ─── Members ────────────────────────────────────────────────────────────────

/**
 * Get members of a group (with client data)
 */
export const getMembers = async (groupId: string, _organizationId: string): Promise<any[]> => {
    const members = await GroupMember.find({ groupId }).lean();
    const clientIds = members.map(m => m.clientId);
    const clients = await Client.find({ _id: { $in: clientIds }, isDeleted: false }).lean();

    const clientMap: Record<string, any> = {};
    clients.forEach(c => { clientMap[c._id] = c; });

    return members.map(m => ({
        ...m,
        client: clientMap[m.clientId] || null,
    }));
};

/**
 * Add a member to a group
 */
export const addMember = async (
    groupId: string,
    clientId: string,
    organizationId: string
): Promise<IGroupMember> => {
    // Verify group exists
    const group = await Group.findOne({ _id: groupId, organizationId, isDeleted: false });
    if (!group) throw new Error('Group not found');

    // Verify client exists
    const client = await Client.findOne({ _id: clientId, organizationId, isDeleted: false });
    if (!client) throw new Error('Client not found');

    // Check for duplicate
    const existing = await GroupMember.findOne({ groupId, clientId });
    if (existing) throw new Error('Client is already a member of this group');

    const member = new GroupMember({ groupId, clientId, organizationId });
    await member.save();
    return member;
};

/**
 * Remove a member from a group
 */
export const removeMember = async (groupId: string, memberId: string): Promise<boolean> => {
    const member = await GroupMember.findOneAndDelete({ _id: memberId, groupId });
    if (!member) throw new Error('Member not found');
    return true;
};

const groupService = {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    getMembers,
    addMember,
    removeMember,
};

export default groupService;
