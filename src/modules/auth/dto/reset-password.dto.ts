import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Your token information',
    example: 'dummyToken9999',
  })
  @IsString()
  token: string;

  @ApiProperty({
    type: String,
    required: true,
    minimum: 3,
    description: 'Your new password information',
    example: '999999999',
  })
  @MinLength(3)
  @IsString()
  newPassword: string;
}
