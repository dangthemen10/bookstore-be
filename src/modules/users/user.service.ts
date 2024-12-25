import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CartItemDto } from '@modules/users/dto';
import { CartItem } from '@modules/users/types/user.types';
import { UserDocument } from '@modules/users/user.schema';
import { Model } from 'mongoose';
import { UserWhereUniqueInput } from '@/modules/users/dto/user-where-unique.input.ts';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('Users') private readonly userModel: Model<UserDocument>,
  ) {}

  public async findOne(where: UserWhereUniqueInput): Promise<UserDocument> {
    const result = (await this.userModel.findOne(where).lean()) as UserDocument;
    return result;
  }

  public async findById(_id: string): Promise<UserDocument> {
    const user = (await this.userModel.findById(_id).lean()) as UserDocument;
    return user;
  }

  public async updateCartItem(userId: string, cartItemDto: CartItemDto) {
    const user = (await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          'cart._id': cartItemDto._id,
        },
        {
          $set: { 'cart.$.total': cartItemDto.total },
        },
        { new: true },
      )
      .lean()) as UserDocument;
    return user;
  }

  public async removeCartItem(userId: string, _id: string) {
    const user = (await this.userModel
      .findByIdAndUpdate(userId, { $pull: { cart: { _id } } }, { new: true })
      .lean()) as UserDocument;
    return user;
  }

  public async removeAllFromCart(userId: string) {
    const user = (await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: { cart: [] },
        },
        { new: true },
      )
      .lean()) as UserDocument;
    return user;
  }

  public async addItemToCart(
    userId: string,
    cartItem: CartItem,
    isExists = false,
  ) {
    let user: UserDocument;
    if (isExists) {
      user = (await this.userModel
        .findOneAndUpdate(
          {
            _id: userId,
            'cart._id': cartItem._id,
          },
          {
            $inc: { 'cart.$.total': cartItem.total },
          },
          { new: true },
        )
        .lean()) as UserDocument;
    } else {
      user = (await this.userModel
        .findOneAndUpdate(
          {
            _id: userId,
          },
          { $push: { cart: cartItem } },
          { new: true },
        )
        .lean()) as UserDocument;
    }
    return user;
  }

  public async updateThumbnail(userId: string, thumbnail: string) {
    const user = (await this.userModel
      .findByIdAndUpdate(userId, { thumbnail: thumbnail }, { new: true })
      .select('+thumbnail')
      .lean()) as UserDocument;
    return user;
  }
}
