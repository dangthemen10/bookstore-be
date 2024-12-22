import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema } from '@/modules/users/user.schema';
import { UserExitsValidator } from './decorators';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Users', schema: userSchema }])],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserExitsValidator],
  exports: [UserRepository],
})
export class UserModule {}
