import { ApiProperty } from '@nestjs/swagger';
import { UserExitsValidator } from '@modules/users/decorators';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  Validate,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ type: String, description: 'Username', example: 'David' })
  @Matches(/[a-zA-Z0-9_-]{2,20}/)
  @Validate(UserExitsValidator)
  username: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  @Validate(UserExitsValidator)
  email: string;

  @ApiProperty({
    type: String,
    required: false,
    minimum: 3,
    description: 'Please input password',
    example: '12345',
  })
  @IsString()
  @MinLength(3)
  @IsOptional()
  password?: string;

  @ApiProperty({ type: String, required: false, example: 'david' })
  @IsOptional()
  @IsString()
  facebookId?: string;

  @ApiProperty({ type: String, required: false, example: 'david' })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}
