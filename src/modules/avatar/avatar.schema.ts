import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserDocument } from '@modules/users/user.schema';
import { Types } from 'mongoose';

export type AvatarDocument = AvatarSchema & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class AvatarSchema {
  @Prop({ type: 'Buffer', required: true })
  data: any;

  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  owner: UserDocument['_id'];
}

const schema = SchemaFactory.createForClass(AvatarSchema);
export const avatarSchema = schema;
