import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserFromRequest } from '@/common/type/http.types';
import { UserWhereUniqueInput } from '@/modules/users/dto/user-where-unique.input.ts';
import { UserDocument } from '@/modules/users/user.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel('Users')
    private readonly userModel: Model<UserDocument>,
  ) {}

  public async findOne(where: UserWhereUniqueInput): Promise<any> {
    return await this.userModel.findOne(where).lean().exec();
  }

  public async findById(_id: string): Promise<any> {
    return await this.userModel.findById(_id).lean().exec();
  }

  public async findUserById(userId: string): Promise<any> {
    return await this.userModel.findById(userId).lean().exec();
  }

  public async findByEmail(email: string): Promise<any> {
    return await this.userModel.findOne({ email }).lean().exec();
  }

  public async findByIdAndUpdateUser(
    id: string,
    refreshToken: string,
  ): Promise<any> {
    return await this.userModel
      .findByIdAndUpdate(id, {
        refreshToken,
      })
      .lean()
      .exec();
  }

  public async createUser(user: UserFromRequest) {
    return await this.userModel.create(user);
  }
}
