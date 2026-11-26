import { Response } from 'express';
import InventoryItem from '../models/InventoryItem';
import InventoryLog, { InventoryLogReason } from '../models/InventoryLog';
import OrganizationMembership from '../models/OrganizationMembership';
import notificationService from '../services/notification.service';
import { AuthRequest, UserRole } from '../types';

export const getInventoryItems = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const organizationId = req.organizationId;
        const {
            search = '',
            category,
            stockStatus = 'all',
            page = '1',
            limit = '30',
        } = req.query as Record<string, string>;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

        const filter: Record<string, any> = { organizationId };

        if (category && category !== 'all') {
            filter.category = category;
        }

        if (search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: regex },
                { color: regex },
                { location: regex },
                { notes: regex },
            ];
        }

        if (stockStatus === 'out') {
            filter.quantity = { $lte: 0 };
        } else if (stockStatus === 'low') {
            filter.$expr = {
                $and: [
                    { $gt: ['$quantity', 0] },
                    { $gt: ['$lowStockThreshold', 0] },
                    { $lte: ['$quantity', '$lowStockThreshold'] },
                ],
            };
        } else if (stockStatus === 'in_stock') {
            filter.$expr = {
                $and: [
                    { $gt: ['$quantity', 0] },
                    {
                        $or: [
                            { $lte: ['$lowStockThreshold', 0] },
                            { $gt: ['$quantity', '$lowStockThreshold'] },
                        ],
                    },
                ],
            };
        }

        const [items, total, allOrgItems] = await Promise.all([
            InventoryItem.find(filter)
                .sort({ updatedAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            InventoryItem.countDocuments(filter),
            InventoryItem.find({ organizationId })
                .select('quantity lowStockThreshold')
                .lean(),
        ]);

        let outOfStockCount = 0;
        let lowStockCount = 0;
        for (const item of allOrgItems) {
            if (item.quantity <= 0) {
                outOfStockCount++;
            } else if (item.lowStockThreshold > 0 && item.quantity <= item.lowStockThreshold) {
                lowStockCount++;
            }
        }

        return res.json({
            success: true,
            data: items,
            summary: {
                totalItems: allOrgItems.length,
                lowStockCount,
                outOfStockCount,
            },
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.max(1, Math.ceil(total / limitNum)),
            },
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch inventory items',
        });
    }
};

export const getInventoryItemById = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const organizationId = req.organizationId;
        const { id } = req.params;

        const item = await InventoryItem.findOne({ _id: id, organizationId }).lean();
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }

        const logs = await InventoryLog.find({ itemId: id, organizationId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        return res.json({
            success: true,
            data: { item, logs },
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch inventory item',
        });
    }
};

export const createInventoryItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const organizationId = req.organizationId!;
        const userId = req.user!._id;
        const userName = req.user!.name || 'Admin';

        const {
            name,
            category = 'fabric',
            quantity = 0,
            unit = 'yards',
            lowStockThreshold = 0,
            color,
            location,
            photoUrl,
            notes,
        } = req.body;

        const parsedQty = Math.max(0, Number(quantity) || 0);
        const parsedThreshold = Math.max(0, Number(lowStockThreshold) || 0);

        const item = await InventoryItem.create({
            organizationId,
            name: String(name).trim(),
            category,
            quantity: parsedQty,
            unit,
            lowStockThreshold: parsedThreshold,
            color: color ? String(color).trim() : null,
            location: location ? String(location).trim() : null,
            photoUrl: photoUrl || null,
            notes: notes ? String(notes).trim() : null,
            createdBy: userId,
            updatedBy: userId,
        });

        if (parsedQty > 0) {
            await InventoryLog.create({
                organizationId,
                itemId: item._id,
                delta: parsedQty,
                previousQuantity: 0,
                newQuantity: parsedQty,
                reason: 'initial',
                note: 'Initial stock added',
                changedBy: userId,
                changedByName: userName,
            });
        }

        return res.status(201).json({
            success: true,
            data: item,
            message: 'Inventory item added successfully',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create inventory item',
        });
    }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const organizationId = req.organizationId!;
        const userId = req.user!._id;
        const { id } = req.params;

        const existing = await InventoryItem.findOne({ _id: id, organizationId });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }

        const {
            name,
            category,
            quantity,
            unit,
            lowStockThreshold,
            color,
            location,
            photoUrl,
            notes,
        } = req.body;

        const previousQuantity = existing.quantity;
        let quantityChanged = false;
        let newQuantity = previousQuantity;

        if (quantity !== undefined && quantity !== null && quantity !== '') {
            newQuantity = Math.max(0, Number(quantity) || 0);
            if (newQuantity !== previousQuantity) {
                existing.quantity = newQuantity;
                quantityChanged = true;
            }
        }

        if (name !== undefined) existing.name = String(name).trim();
        if (category !== undefined) existing.category = category;
        if (unit !== undefined) existing.unit = unit;
        if (lowStockThreshold !== undefined) {
            existing.lowStockThreshold = Math.max(0, Number(lowStockThreshold) || 0);
        }
        if (color !== undefined) existing.color = color ? String(color).trim() : null;
        if (location !== undefined) existing.location = location ? String(location).trim() : null;
        if (photoUrl !== undefined) existing.photoUrl = photoUrl || null;
        if (notes !== undefined) existing.notes = notes ? String(notes).trim() : null;
        existing.updatedBy = userId;

        await existing.save();

        if (quantityChanged) {
            await InventoryLog.create({
                organizationId,
                itemId: existing._id,
                delta: Number((newQuantity - previousQuantity).toFixed(2)),
                previousQuantity,
                newQuantity,
                reason: 'correction',
                note: 'Updated via Edit Item',
                changedBy: userId,
                changedByName: req.user!.name || 'Admin',
            });
        }

        return res.json({
            success: true,
            data: existing,
            message: 'Inventory item updated successfully',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update inventory item',
        });
    }
};

export const adjustInventoryStock = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const organizationId = req.organizationId!;
        const userId = req.user!._id;
        const userName = req.user!.name || 'Team Member';
        const { id } = req.params;
        const { delta, newQuantity, reason = 'correction', note } = req.body as {
            delta?: number;
            newQuantity?: number;
            reason?: InventoryLogReason;
            note?: string;
        };

        const item = await InventoryItem.findOne({ _id: id, organizationId });
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }

        const previousQuantity = item.quantity;
        let computedNewQty = previousQuantity;

        if (newQuantity !== undefined && newQuantity !== null) {
            computedNewQty = Math.max(0, Number(newQuantity));
        } else if (delta !== undefined && delta !== null) {
            computedNewQty = Math.max(0, Number((previousQuantity + Number(delta)).toFixed(2)));
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either delta or newQuantity is required',
            });
        }

        const actualDelta = Number((computedNewQty - previousQuantity).toFixed(2));
        item.quantity = computedNewQty;
        item.updatedBy = userId;
        await item.save();

        const log = await InventoryLog.create({
            organizationId,
            itemId: item._id,
            delta: actualDelta,
            previousQuantity,
            newQuantity: computedNewQty,
            reason,
            note: note ? String(note).trim() : null,
            changedBy: userId,
            changedByName: userName,
        });

        // Notify admins if stock just dropped to Out of Stock or Low Stock
        const hitOutOfStock = computedNewQty <= 0 && previousQuantity > 0;
        const hitLowStock =
            item.lowStockThreshold > 0 &&
            computedNewQty > 0 &&
            computedNewQty <= item.lowStockThreshold &&
            previousQuantity > item.lowStockThreshold;

        if (hitOutOfStock || hitLowStock) {
            try {
                const adminMemberships = await OrganizationMembership.find({
                    organizationId,
                    role: UserRole.ORG_ADMIN,
                    status: 'active',
                })
                    .select('userId')
                    .lean();

                const notifType = hitOutOfStock ? 'INVENTORY_OUT_OF_STOCK' : 'INVENTORY_LOW_STOCK';
                const title = hitOutOfStock ? 'Out of Stock Alert' : 'Low Stock Alert';
                const message = hitOutOfStock
                    ? `${item.name} is now out of stock (updated by ${userName}).`
                    : `${item.name} is running low (${computedNewQty} ${item.unit} left).`;

                await Promise.all(
                    adminMemberships.map((m) =>
                        notificationService.sendToUser(m.userId, {
                            title,
                            message,
                            type: notifType,
                            data: { itemId: item._id, quantity: computedNewQty, unit: item.unit },
                        })
                    )
                );
            } catch (notifErr) {
                console.error('Failed to send inventory stock alert:', notifErr);
            }
        }

        return res.json({
            success: true,
            data: { item, log },
            message: 'Stock updated successfully',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to adjust stock',
        });
    }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const organizationId = req.organizationId!;
        const { id } = req.params;

        const item = await InventoryItem.findOneAndDelete({ _id: id, organizationId });
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }

        await InventoryLog.deleteMany({ itemId: id, organizationId });

        return res.json({
            success: true,
            message: 'Inventory item deleted successfully',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete inventory item',
        });
    }
};
