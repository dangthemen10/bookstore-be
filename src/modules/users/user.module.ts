import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { bookSchema } from '@modules/books/book.schema';
import { BookService } from '@modules/books/book.service';
import { UserExitsValidator } from '@modules/users/decorators';
import { UserController } from '@modules/users/user.controller';
import { userSchema } from '@modules/users/user.schema';
import { UserService } from '@modules/users/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Users', schema: userSchema },
      { name: 'Books', schema: bookSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserExitsValidator, BookService],
  exports: [UserService],
})
export class UserModule {}
