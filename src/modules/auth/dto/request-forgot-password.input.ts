import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestForgotPasswordInput {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Your email information',
    example: 'david@gmail.com',
  })
  @IsEmail()
  email: string;
}
