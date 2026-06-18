import mongoose, { Schema, Document } from 'mongoose';

export interface IAvatar extends Document {
  name: string;
  url: string;
  isActive: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AvatarSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    category: { type: String, default: 'tailor' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAvatar>('Avatar', AvatarSchema);
