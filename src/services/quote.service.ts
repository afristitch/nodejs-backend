import QuoteRequest from '../models/QuoteRequest';
import User from '../models/User';
import notificationService from './notification.service';
import { IQuoteRequest, QuoteRequestStatus, PaginationOptions } from '../types';
import logger from '../utils/logger';

/**
 * Quote Service
 * Handles inquiries and studio responses
 */

/**
 * Create a new quote request
 */
export const createQuoteRequest = async (data: Partial<IQuoteRequest>): Promise<IQuoteRequest> => {
    const quoteRequest = await QuoteRequest.create(data);
    
    // Trigger notification to studio staff
    try {
        const staff = await User.find({ organizationId: quoteRequest.tailorId });
        const notificationData = {
            title: 'New Quote Request',
            message: `You have a new inquiry from ${quoteRequest.guestInfo?.name || 'a customer'}.`,
            type: 'QUOTE_REQUEST',
            data: { requestId: quoteRequest._id },
        };

        for (const member of staff) {
            await notificationService.sendToUser(member._id, notificationData);
        }
    } catch (error) {
        logger.error('Error sending quote notification', { error, requestId: quoteRequest._id });
    }

    return quoteRequest;
};

/**
 * Get quotes for an organization
 */
export const getQuotesForOrganization = async (
    orgId: string,
    options: PaginationOptions,
    status?: QuoteRequestStatus
): Promise<{ quotes: IQuoteRequest[]; total: number }> => {
    const query: any = { tailorId: orgId };
    if (status) {
        query.status = status;
    }

    const [quotes, total] = await Promise.all([
        QuoteRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(options.skip)
            .limit(options.limit),
        QuoteRequest.countDocuments(query),
    ]);

    return { quotes, total };
};

/**
 * Get quote by ID
 */
export const getQuoteById = async (id: string, orgId?: string): Promise<IQuoteRequest> => {
    const query: any = { _id: id };
    if (orgId) {
        query.tailorId = orgId;
    }

    const quote = await QuoteRequest.findOne(query);
    if (!quote) {
        throw new Error('Quote request not found');
    }

    return quote;
};

/**
 * Respond to a quote request
 */
export const respondToQuote = async (
    id: string, 
    orgId: string, 
    data: { amount: number; items: any[]; notes?: string }
): Promise<IQuoteRequest> => {
    const quote = await QuoteRequest.findOneAndUpdate(
        { _id: id, tailorId: orgId },
        { 
            $set: { 
                quoteAmount: data.amount, 
                quoteItems: data.items,
                notes: data.notes,
                status: QuoteRequestStatus.QUOTED 
            } 
        },
        { new: true }
    );

    if (!quote) {
        throw new Error('Quote request not found');
    }

    // TODO: Trigger notification to customer if they are registered

    return quote;
};

const quoteService = {
    createQuoteRequest,
    getQuotesForOrganization,
    getQuoteById,
    respondToQuote,
};

export default quoteService;
