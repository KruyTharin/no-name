import { ApiProperty } from '@nestjs/swagger';
import { User as PrismaUser } from '@prisma/client';

export class UserEntity implements Omit<PrismaUser, 'password'> {
  @ApiProperty({
    example: 'clx1234567890',
    description: 'User unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    example: '2024-12-02T10:00:00.000Z',
    description: 'User creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-12-02T10:00:00.000Z',
    description: 'User last update timestamp',
  })
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
