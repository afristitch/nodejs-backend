import Client from '../models/Client';
import { IClient, PaginationOptions } from '../types';

/**
 * Client Service
 * Handles customer business logic
 */

/**
 * Create a new client
 */
export const createClient = async (
    organizationId: string,
    clientData: any,
    userId: string
): Promise<IClient> => {
    const client = new Client({
        ...clientData,
        organizationId,
        createdBy: userId,
    });

    await client.save();
    return client;
};

/**
 * Get all clients in an organization
 */
export const getClients = async (
    organizationId: string,
    options: PaginationOptions,
    search: string = ''
): Promise<{ clients: IClient[]; total: number }> => {
    const query: any = { organizationId, isDeleted: false };

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const [clients, total] = await Promise.all([
        Client.find(query)
            .sort({ createdAt: -1 })
            .skip(options.skip)
            .limit(options.limit),
        Client.countDocuments(query),
    ]);

    return { clients, total };
};

/**
 * Get client by ID
 */
export const getClientById = async (id: string, organizationId: string): Promise<IClient> => {
    const client = await Client.findOne({ _id: id, organizationId, isDeleted: false });

    if (!client) {
        throw new Error('Client not found');
    }

    return client;
};

/**
 * Update client
 */
export const updateClient = async (
    id: string,
    organizationId: string,
    updateData: any
): Promise<IClient> => {
    const client = await Client.findOneAndUpdate(
        { _id: id, organizationId, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!client) {
        throw new Error('Client not found');
    }

    return client;
};

/**
 * Delete client (soft delete)
 */
export const deleteClient = async (id: string, organizationId: string): Promise<boolean> => {
    const client = await Client.findOneAndUpdate(
        { _id: id, organizationId, isDeleted: false },
        { $set: { isDeleted: true } }
    );

    if (!client) {
        throw new Error('Client not found');
    }

    return true;
};

const clientService = {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
};

export default clientService;
