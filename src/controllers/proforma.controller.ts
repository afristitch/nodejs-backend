import { Response } from 'express';
import Proforma from '../models/Proforma';
import { AuthRequest } from '../types';

export const proformaController = {
    // Create Proforma Invoice
    create: async (req: AuthRequest, res: Response) => {
        try {
            const organizationId = req.organizationId;
            const userId = req.user?._id;

            if (!organizationId) {
                return res.status(403).json({ success: false, message: 'Organization context missing' });
            }

            const { clientName, clientPhone, clientAddress, items, subtotal, notes } = req.body;

            const proforma = new Proforma({
                clientName,
                clientPhone,
                clientAddress,
                items,
                subtotal,
                notes,
                organizationId,
                createdBy: userId
            });

            await proforma.save();
            return res.status(201).json({ success: true, data: proforma });
        } catch (error: any) {
            console.error('Create proforma error:', error);
            return res.status(500).json({ success: false, message: error.message || 'Error creating proforma invoice' });
        }
    },

    // Get All Proforma Invoices
    getAll: async (req: AuthRequest, res: Response) => {
        try {
            const organizationId = req.organizationId;
            if (!organizationId) {
                return res.status(403).json({ success: false, message: 'Organization context missing' });
            }

            const proformas = await Proforma.find({ organizationId }).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: proformas });
        } catch (error: any) {
            console.error('Get proformas error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching proforma invoices' });
        }
    },

    // Get Proforma Invoice by ID
    getById: async (req: AuthRequest, res: Response) => {
        try {
            const organizationId = req.organizationId;
            const proforma = await Proforma.findOne({ _id: req.params.id, organizationId });
            
            if (!proforma) {
                return res.status(404).json({ success: false, message: 'Proforma invoice not found' });
            }

            return res.status(200).json({ success: true, data: proforma });
        } catch (error: any) {
            console.error('Get proforma error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching proforma invoice' });
        }
    },

    // Update Proforma Invoice
    update: async (req: AuthRequest, res: Response) => {
        try {
            const organizationId = req.organizationId;
            const { clientName, clientPhone, clientAddress, items, subtotal, notes } = req.body;

            const proforma = await Proforma.findOneAndUpdate(
                { _id: req.params.id, organizationId },
                { clientName, clientPhone, clientAddress, items, subtotal, notes },
                { new: true, runValidators: true }
            );

            if (!proforma) {
                return res.status(404).json({ success: false, message: 'Proforma invoice not found' });
            }

            return res.status(200).json({ success: true, data: proforma });
        } catch (error: any) {
            console.error('Update proforma error:', error);
            return res.status(500).json({ success: false, message: error.message || 'Error updating proforma invoice' });
        }
    },

    // Delete Proforma Invoice
    delete: async (req: AuthRequest, res: Response) => {
        try {
            const organizationId = req.organizationId;
            const proforma = await Proforma.findOneAndDelete({ _id: req.params.id, organizationId });
            
            if (!proforma) {
                return res.status(404).json({ success: false, message: 'Proforma invoice not found' });
            }

            return res.status(200).json({ success: true, message: 'Proforma invoice deleted successfully' });
        } catch (error: any) {
            console.error('Delete proforma error:', error);
            return res.status(500).json({ success: false, message: 'Error deleting proforma invoice' });
        }
    }
};

export default proformaController;
