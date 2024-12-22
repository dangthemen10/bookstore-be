import { Injectable } from '@nestjs/common';
import { emailRegex, UserDocument } from '@modules/users/user.schema';
import { UserService } from '@modules/users/user.service';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'user', async: true })
@Injectable()
export class UserExitsValidator implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async validate(usernameOrEmail: string, _args: ValidationArguments) {
    const isEmail = emailRegex.test(usernameOrEmail);

    let check: UserDocument;
    if (isEmail) {
      check = await this.userService.findOne({
        email: usernameOrEmail,
      });
    } else {
      check = await this.userService.findOne({
        username: usernameOrEmail,
      });
    }
    // if user exist --> return false: can not validate
    if (check) return false;

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments) {
    return 'User with $property $value already exists';
  }
}
