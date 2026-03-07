import { Request } from 'express';

/**
 * User Roles
 */
export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ORG_ADMIN = 'ORG_ADMIN',
    STAFF = 'STAFF',
}

/**
 * Order Status
 */
export enum OrderStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    FITTING = 'fitting',
    COMPLETED = 'completed',
    DELIVERED = 'delivered',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
    UNPAID = 'unpaid',
    PARTIAL = 'partial',
    PAID = 'paid',
}

/**
 * Subscription Plan
 */
export enum SubscriptionPlan {
    FREE = 'free',
    PREMIUM = 'premium',
}

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
    ACTIVE = 'active',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    TRIALING = 'trialing',
}

/**
 * Plan Interface
 */
export interface IPlan {
    _id: string; // UUID
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}


/**
 * Organization Interface
 */
export interface IOrganization {
    _id: string; // UUID
    name: string;
    logoUrl?: string;
    email: string;
    phone?: string;
    address?: string;
    createdBy: string; // UUID
    subscriptionPlan: string; // Reference to Plan ID or Plan Name
    planId?: string; // UUID reference to Plan model
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt?: Date;
    subscriptionEndsAt?: Date;
    paystackCustomerCode?: string;
    paystackSubscriptionCode?: string;
    paystackPlanCode?: string;
    revenuecatAppUserId?: string;
    createdAt: Date;
    updatedAt: Date;
}



/**
 * User Interface
 */
export interface IUser {
    _id: string; // UUID
    name: string;
    email: string;
    password: string;
    role: UserRole;
    organizationId: string; // UUID
    isEmailVerified: boolean;
    photoUrl?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    isAdmin(): boolean;
}


/**
 * Client Interface
 */
export interface IClient {
    _id: string; // UUID
    name: string;
    phone: string;
    email?: string;
    photoUrl?: string;
    notes?: string;
    organizationId: string; // UUID
    createdBy: string; // UUID
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Measurement Template Field
 */
export interface IMeasurementField {
    name: string;
    unit?: string;
    description?: string;
}

/**
 * Measurement Template Interface
 */
export interface IMeasurementTemplate {
    _id: string; // UUID
    name: string;
    description?: string;
    fields: IMeasurementField[];
    organizationId: string; // UUID
    createdBy: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Measurement Interface
 */
export interface IMeasurement {
    _id: string; // UUID
    clientId: string; // UUID
    orderId?: string; // UUID
    templateId: string; // UUID
    values: Map<string, string>;
    notes?: string;
    organizationId: string; // UUID
    createdBy: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Order Interface
 */
export interface IOrder {
    _id: string; // UUID
    clientId: string; // UUID
    measurementsId?: string; // UUID
    orderNumber: string;
    status: OrderStatus;
    amount: number;
    amountPaid: number;
    balance: number; // Virtual field
    paymentStatus: PaymentStatus;
    dueDate?: Date;
    deliveryDate?: Date;
    notes?: string;
    clothImageUrl?: string;
    clothSize?: string;
    organizationId: string; // UUID
    createdBy: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Extended Request with authenticated user
 */
export interface AuthRequest extends Request {
    user?: IUser;
    organizationId?: string; // UUID
}

/**
 * Pagination Query Parameters
 */
export interface PaginationQuery {
    page?: string;
    limit?: string;
    search?: string;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
    skip: number;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}

/**
 * JWT Payload
 */
export interface JWTPayload {
    userId: string; // UUID
}

/**
 * Auth Response
 */
export interface AuthResponse {
    user: IUser;
    accessToken: string;
    refreshToken: string;
    organization?: IOrganization;
}
