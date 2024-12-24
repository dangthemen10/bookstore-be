import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvatarController } from '@modules/avatar/avatar.controller';
import { avatarSchema } from '@modules/avatar/avatar.schema';
import { userSchema } from '@modules/users/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Users', schema: userSchema },
      { name: 'Avatars', schema: avatarSchema },
    ]),
  ],
  controllers: [AvatarController],
})
export class AvatarModule {}
