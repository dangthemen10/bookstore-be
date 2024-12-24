import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookController } from '@modules/books/book.controller';
import { BookSchema } from '@modules/books/book.schema';
import { BookService } from '@modules/books/book.service';
import { UserSchema } from '@modules/users/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Books', schema: BookSchema },
      { name: 'Users', schema: UserSchema },
    ]),
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
