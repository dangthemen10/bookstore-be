import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Your username or email information',
    example: 'David',
  })
  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string;

  @ApiProperty({
    type: String,
    required: true,
    minimum: 3,
    description: 'Your password information',
    example: '123456789',
  })
  @IsString()
  @MinLength(3)
  password: string;
}
