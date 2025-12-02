import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly saltRounds = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        this.saltRounds,
      );

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
        },
      });

      this.logger.log(`User created: ${user.email}`);

      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to create user', error.stack);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Find all users with pagination
   */
  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: UserEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count(),
      ]);

      return {
        data: users.map((user) => this.excludePassword(user)),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to fetch users', error.stack);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  /**
   * Find a user by ID
   */
  async findOne(id: string): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch user', error.stack);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user ? this.excludePassword(user) : null;
    } catch (error) {
      this.logger.error('Failed to fetch user by email', error.stack);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  /**
   * Update a user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    try {
      // Check if user exists
      await this.findOne(id);

      // If email is being updated, check for conflicts
      if (updateUserDto.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });

        if (existingUser && existingUser.id !== id) {
          throw new ConflictException('Email already in use');
        }
      }

      // Hash new password if provided
      const updateData: Partial<CreateUserDto> = {
        email: updateUserDto.email,
        name: updateUserDto.name,
      };

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(
          updateUserDto.password,
          this.saltRounds,
        );
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`User updated: ${user.email}`);

      return this.excludePassword(user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error('Failed to update user', error.stack);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  /**
   * Delete a user
   */
  async remove(id: string): Promise<void> {
    try {
      // Check if user exists
      await this.findOne(id);

      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`User deleted: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to delete user', error.stack);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /**
   * Validate user credentials (for authentication)
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return this.excludePassword(user);
    } catch (error) {
      this.logger.error('Failed to validate credentials', error.stack);
      return null;
    }
  }

  /**
   * Exclude password from user object
   */
  private excludePassword(user: any): UserEntity {
    const { password, ...userWithoutPassword } = user;
    return new UserEntity(userWithoutPassword);
  }
}
