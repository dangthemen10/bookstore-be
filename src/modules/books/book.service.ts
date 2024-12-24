import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BookDocument } from '@modules/books/book.schema';
import { PaginatedBooksDto, PaginationDto } from '@modules/books/dto';
import { FilterQuery, Model } from 'mongoose';

@Injectable()
export class BookService {
  constructor(
    @InjectModel('Books') private readonly bookModel: Model<BookDocument>,
  ) {}

  public async findOne(filter: FilterQuery<BookDocument>) {
    const book = (await this.bookModel.findOne(filter).lean()) as BookDocument;
    return book;
  }

  public async findById(id: string) {
    const book = (await this.bookModel.findById(id).lean()) as BookDocument;
    return book;
  }

  public async findManyByGenre(
    genre: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedBooksDto> {
    const count = await this.bookModel.countDocuments({ genre });
    let books: BookDocument[];

    if (!pagination) {
      books = (await this.bookModel.find({}).lean()) as BookDocument[];
    } else {
      const { limit, page } = pagination;
      books = (await this.bookModel
        .find({ genre: genre })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()) as BookDocument[];
    }
    return { count, books };
  }

  public async searchBooks(q: string): Promise<BookDocument[]> {
    const books: BookDocument[] = (await this.bookModel
      .find({ $text: { $search: `\"${q}\"` } })
      .limit(10)
      .lean()) as BookDocument[];
    return books;
  }

  public async queryBooks(
    q: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedBooksDto> {
    const count = await this.bookModel.countDocuments({
      $text: { $search: `\"${q}\"` },
    });
    const limit = pagination?.limit || 25;
    const page = pagination?.page || 1;

    const books: BookDocument[] = (await this.bookModel
      .find({ $text: { $search: `\"${q}\"` } })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()) as BookDocument[];

    return { count, books };
  }
}
