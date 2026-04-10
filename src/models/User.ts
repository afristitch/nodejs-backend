import mongoose, { Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { IUser, UserRole } from '../types';

/**
 * User Schema
 * Represents users (ORG_ADMIN or STAFF) belonging to an organization
 */
const userSchema = new Schema<IUser>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.STAFF,
            required: true,
        },
        organizationId: {
            type: String,
            required: [
                function (this: any) {
                    return this.role !== UserRole.SUPER_ADMIN;
                },
                'Organization is required',
            ],
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        photoUrl: {
            type: String,
            trim: true,
            default: null,
        },
        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
userSchema.index({ organizationId: 1 });
userSchema.index({ organizationId: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function (): boolean {
    return this.role === UserRole.ORG_ADMIN || this.role === UserRole.SUPER_ADMIN;
};

// Instance method to convert user to JSON (remove sensitive data)
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    return userObject;
};

export default mongoose.model<IUser>('User', userSchema);
