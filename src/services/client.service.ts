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
    organizationId: string | undefined,
    options: PaginationOptions,
    search: string = ''
): Promise<{ clients: IClient[]; total: number }> => {
    const query: any = { isDeleted: false };
    if (organizationId) query.organizationId = organizationId;

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
export const getClientById = async (id: string, organizationId: string | undefined): Promise<IClient> => {
    const query: any = { _id: id, isDeleted: false };
    if (organizationId) query.organizationId = organizationId;

    const client = await Client.findOne(query);

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
    organizationId: string | undefined,
    updateData: any
): Promise<IClient> => {
    const query: any = { _id: id, isDeleted: false };
    if (organizationId) query.organizationId = organizationId;

    const client = await Client.findOneAndUpdate(
        query,
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
export const deleteClient = async (id: string, organizationId: string | undefined): Promise<boolean> => {
    const query: any = { _id: id, isDeleted: false };
    if (organizationId) query.organizationId = organizationId;

    const client = await Client.findOneAndUpdate(
        query,
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
