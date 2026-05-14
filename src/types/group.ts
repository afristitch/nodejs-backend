/**
 * Group Interface
 */
export interface IGroup {
    _id: string; // UUID
    name: string;
    description?: string;
    organizationId: string; // UUID
    createdBy: string; // UUID
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Group Member Interface
 */
export interface IGroupMember {
    _id: string; // UUID
    groupId: string; // UUID
    clientId: string; // UUID
    organizationId: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}
