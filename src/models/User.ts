import mongoose, { Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from '../types';

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
        phone: {
            type: String,
            trim: true,
            default: null,
        },
        password: {
            type: String,
            required: [
                function (this: any) {
                    return !this.googleId && !this.appleId;
                },
                'Password is required'
            ],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        googleId: {
            type: String,
            trim: true,
            default: null,
            sparse: true,
            unique: true,
        },
        appleId: {
            type: String,
            trim: true,
            default: null,
            sparse: true,
            unique: true,
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

// Indexes (If any needed in future)

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

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
    if (!this.password) return false;
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Note: isAdmin() logic must now be handled at the membership level

// Instance method to convert user to JSON (remove sensitive data)
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    return userObject;
};

export default mongoose.model<IUser>('User', userSchema);
