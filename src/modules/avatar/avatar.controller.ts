import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuth } from '@modules/auth/guards';
import { AvatarDocument } from '@modules/avatar/avatar.schema';
import { UserDocument } from '@modules/users/user.schema';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { envConfig } from '@/common/config/env.config';
import { UserFromRequest } from '@/common/type';

@JwtAuth()
@Controller('avatars')
@ApiTags('Avatar')
export class AvatarController {
  constructor(
    @InjectModel('Avatars') private avatarModel: Model<AvatarDocument>,
    @InjectModel('Users') private userModel: Model<UserDocument>,
  ) {}

  @Get('/:key')
  public async getByKey(@Param('key') key: string, @Res() res: Response) {
    const image: AvatarDocument = await this.avatarModel.findOne({ key });
    if (!image) {
      throw new BadRequestException('Image not exists');
    }
    res.contentType('image/*');
    res.send(image.data);
  }

  /**
   * Uploads an image file as the user's avatar and updates the user's thumbnail.
   *
   * This method handles the upload of an image file, creates a new avatar entry or updates an existing one,
   * and updates the user's thumbnail URL. It uses a database transaction to ensure data consistency.
   *
   * @param req - The incoming request object, containing the authenticated user information.
   * @param file - The uploaded file object, containing the image data and metadata.
   * @returns A Promise that resolves to the updated UserDocument with the new thumbnail URL.
   * @throws BadRequestException if no file is provided in the request.
   * @throws HttpException with a 500 status code if any error occurs during the process.
   */
  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadImage(@Req() req: Request, @UploadedFile() file: any) {
    try {
      const user = req.user as UserFromRequest;
      if (!file) {
        throw new BadRequestException('Please choose a file');
      }
      const key = Date.now() + '-' + file.originalname;
      const data = file.buffer;
      // Transaction avatar & user thumbnail
      const session = await this.userModel.startSession();
      session.startTransaction();
      await this.avatarModel
        .findOneAndUpdate(
          {
            owner: user._id,
          },
          { key, data },
          { new: true, upsert: true },
        )
        .lean();

      const path = envConfig().clientUrl + `/api/avatars/${key}`;
      const updated = await this.userModel
        .findByIdAndUpdate(user._id, { thumbnail: path })
        .select('+thumbnail')
        .lean()
        .exec();
      await session.commitTransaction();
      session.endSession();
      return updated as UserDocument;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  /**
   * Deletes an avatar image by its unique key and updates the associated user's thumbnail.
   *
   * This method performs the following operations:
   * 1. Finds the image in the database using the provided key.
   * 2. If the image exists, starts a database transaction.
   * 3. Deletes the image from the avatar collection.
   * 4. Updates the associated user's thumbnail to an empty string.
   * 5. Commits the transaction if all operations are successful.
   *
   * @param key - The unique identifier of the avatar image to be deleted.
   * @returns A promise that resolves to an object containing:
   *          - deleted: A boolean indicating whether the deletion was successful.
   *          - key: The key of the image that was attempted to be deleted.
   *          - error: null if successful, or an error message if the operation failed.
   * @throws BadRequestException if the image with the given key is not found.
   */
  @Delete('/:key')
  public async deleteByKey(@Param('key') key: string) {
    try {
      const image = await this.avatarModel.findOne({ key }).lean().exec();
      if (!image) {
        throw new BadRequestException(`Image not found with key: ${key}`);
      }
      const session = await this.avatarModel.startSession();
      session.startTransaction();
      await Promise.all([
        this.avatarModel.findOneAndDelete({ key }).lean().exec(),
        this.userModel
          .findOneAndUpdate({ id: image?.owner }, { thumbnail: '' })
          .lean()
          .exec(),
      ]);
      await session.commitTransaction();
      session.endSession();
      return { deleted: true, key, error: null };
    } catch (error) {
      return { deleted: false, key: key, error: error.message };
    }
  }
}
