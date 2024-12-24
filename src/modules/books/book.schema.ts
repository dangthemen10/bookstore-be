import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Document } from 'mongoose';
import slugify from 'slugify';

export type BookDocument = BookSchema & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class BookSchema {
  @Prop()
  title: string;

  @Prop()
  author: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Number, required: false })
  old_price?: number;

  @Prop()
  imgURL: string;

  @Prop()
  genre: string;

  @Prop()
  slug: string;
}

const schema = SchemaFactory.createForClass(BookSchema);
export const bookSchema = schema;

// Create indexes
bookSchema.index({ author: 'text', title: 'text', genre: 'text' });

// Hook before insert or update
bookSchema.pre('save', function (next) {
  try {
    if (!this.isModified('title')) return next();
    const randomString = randomBytes(6).toString('hex').substr(0, 6);
    this.slug = slugify(this.title, { lower: true }) + '-' + randomString;
    return next();
  } catch (error) {
    return next(error);
  }
});
