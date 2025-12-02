import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    description: 'User status',
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
