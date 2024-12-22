import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import argon2 from 'argon2';
import { Document } from 'mongoose';
import slugify from 'slugify';

export enum RoleType {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export type UserDocument = UserSchema & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class UserSchema {
  @Prop({ unique: true })
  email: string;

  @Prop({ type: String, select: false })
  password: string;

  @Prop()
  username: string;

  @Prop({ required: false })
  googleId?: string;

  @Prop({ required: false })
  facebookId?: string;

  @Prop({ required: false })
  thumbnail?: string;

  @Prop({ type: Array, default: [] })
  cart: any[];

  @Prop({ type: String, enum: Object.values(RoleType), default: RoleType.USER })
  role: RoleType;

  @Prop({ type: String, select: false, required: false })
  currentHashedRefreshToken?: string;
}

const schema = SchemaFactory.createForClass(UserSchema);
export const userSchema = schema;

userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await argon2.hash(this.password);
    return next();
  } catch (error) {
    return next(error);
  }
});

export const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
userSchema.pre('save', function (next) {
  try {
    if (!this.email) return next();
    const isEmail = emailRegex.test(this.email);
    if (isEmail) return next();

    return next(new Error('Invalid email address'));
  } catch (error) {
    return next(error);
  }
});

userSchema.pre('save', function (next) {
  try {
    if (!this.isModified('username')) return next();
    this.username = slugify(this.username, { lower: true });
    return next();
  } catch (error) {
    next(error);
  }
});
