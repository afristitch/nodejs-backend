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
}

/**
 * Quote Request Status
 */
export enum QuoteRequestStatus {
    PENDING = 'pending',
    QUOTED = 'quoted',
    ORDERED = 'ordered',
    REJECTED = 'rejected',
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
    subscriptionEndsAt?: Date;
    revenuecatAppUserId?: string;
    isSetupComplete?: boolean;
    
    // Discovery fields
    isPublic?: boolean;
    slug?: string;
    bio?: string;
    specialties?: string[];
    portfolio?: Array<{
        title: string;
        description?: string;
        imageUrl: string;
        tags?: string[];
        createdAt: Date;
    }>;
    rating?: number;
    reviewCount?: number;
    referralCode?: string;
    paymentInstructions?: {
        momo?: Array<{
            network: string;
            number: string;
            name: string;
        }>;
        bank?: Array<{
            bankName: string;
            accountNumber: string;
            accountName: string;
            branch?: string;
        }>;
        generalNote?: string;
    };
    latitude?: number;
    longitude?: number;
    
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Organization Membership Interface
 */
export interface IOrganizationMembership {
    _id: string; // UUID
    userId: string; // UUID
    organizationId: string; // UUID
    role: UserRole;
    status: 'active' | 'pending_invite' | 'suspended';
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
    phone?: string;
    password?: string;
    googleId?: string;
    appleId?: string;
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
    iconUrl?: string;
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
    styleId?: string; // UUID reference to Style model
    organizationId: string; // UUID
    createdBy: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Quote Item Interface (for Pro-Forma quotes)
 */
export interface IQuoteItem {
    id: string; // Used by frontend for UI mapping
    description: string;
    quantity: number;
    price: number;
}

/**
 * Proforma Interface (Pro-Forma Invoices)
 */
export interface IProforma {
    _id: string; // UUID
    clientName: string;
    clientPhone: string;
    clientAddress?: string;
    items: IQuoteItem[];
    subtotal: number;
    notes?: string;
    organizationId: string; // UUID
    createdBy: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Quote Request Interface
 */
export interface IQuoteRequest {
    _id: string; // UUID
    tailorId: string; // Organization ID
    customerId?: string; // User ID (for logged-in users)
    guestInfo?: {
        name: string;
        email: string;
        phone: string;
    };
    details: string;
    quoteAmount?: number;
    quoteItems?: Array<{ description: string, price: number }>;
    pdfUrl?: string;
    status: QuoteRequestStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Extended Request with authenticated user
 */
export interface AuthRequest extends Request {
    user?: IUser;
    organizationId?: string; // UUID
    membershipRole?: UserRole; // Populated by organization middleware
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
    memberships?: Array<IOrganizationMembership & { organization?: IOrganization }>;
    organization?: IOrganization; // Legacy fallback, to be removed eventually
}

/**
 * Device Token Interface
 */
export interface IDeviceToken {
    _id: string; // UUID
    userId: string; // UUID
    token: string;
    platform: 'ios' | 'android' | 'web';
    lastUsedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Notification Interface
 */
export interface INotification {
    _id: string; // UUID
    userId: string; // UUID
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Style Gender
 */
export enum StyleGender {
    MALE = 'male',
    FEMALE = 'female',
    UNISEX = 'unisex',
}

/**
 * Style Interface
 */
export interface IStyle {
    _id: string; // UUID
    name: string;
    description?: string;
    imageUrl: string;
    gender: StyleGender;
    tags?: string[];
    organizationId?: string; // UUID (optional for global styles)
    createdBy: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

/**
 * System Settings Interface
 */
export interface ISystemSettings {
    monitoringEnabled: boolean;
    checkInterval: number; // in seconds
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    latestIosVersion?: string;
    latestAndroidVersion?: string;
    iosUpdateUrl?: string;
    androidUpdateUrl?: string;
    forceUpdate?: boolean;
    updatedAt: Date;
}
