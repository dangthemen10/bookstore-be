import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserExitsValidator } from '@modules/users/decorators';
import { UserController } from '@modules/users/user.controller';
import { UserRepository } from '@modules/users/user.repository';
import { userSchema } from '@modules/users/user.schema';
import { UserService } from '@modules/users/user.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Users', schema: userSchema }])],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserExitsValidator],
  exports: [UserRepository],
})
export class UserModule {}
