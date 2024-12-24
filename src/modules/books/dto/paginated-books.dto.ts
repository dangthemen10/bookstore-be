import { ApiProperty } from '@nestjs/swagger';
import { BookDocument } from '@modules/books/book.schema';
import { IsNumber, IsObject } from 'class-validator';

export class PaginatedBooksDto {
  @ApiProperty()
  @IsNumber()
  count: number;

  @ApiProperty()
  @IsObject()
  books: BookDocument[];
}
