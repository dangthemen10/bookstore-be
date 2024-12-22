import { Injectable } from '@nestjs/common';
import { UserRepository } from '@modules/users/user.repository';
import { UserWhereUniqueInput } from '@/modules/users/dto/user-where-unique.input.ts';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async findOne(where: UserWhereUniqueInput): Promise<any> {
    const result: any = await this.userRepository.findOne(where);
    return result;
  }
}
