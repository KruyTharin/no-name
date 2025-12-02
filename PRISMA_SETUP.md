# Prisma Setup Guide

Prisma has been configured for your NestJS project with a File model for tracking uploaded files.

## ✅ What's Been Set Up

1. **Prisma Dependencies Installed**
   - `@prisma/client` - Prisma ORM client
   - `prisma` - Prisma CLI (dev dependency)
   - `dotenv` - Environment variable support

2. **Prisma Module Created**
   - `src/prisma/prisma.service.ts` - Global Prisma service with logging
   - `src/prisma/prisma.module.ts` - Global module (available everywhere)
   - Added to `AppModule` for application-wide access

3. **Database Schema**
   - File model to track uploaded files with metadata
   - Indexed for fast lookups by `objectName` and `createdAt`

4. **NPM Scripts Added**
   ```bash
   pnpm prisma:generate  # Generate Prisma Client
   pnpm prisma:migrate   # Run migrations
   pnpm prisma:studio    # Open Prisma Studio UI
   ```

## 🚀 Setup Steps

### 1. Configure Database Connection

Update your `.env` file with correct database credentials:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/dailyclip"
```

### 2. Start Database

**Option A: Use existing PostgreSQL**

```bash
# Make sure PostgreSQL is running on port 5432
```

**Option B: Use Docker (recommended)**

```bash
docker compose up -d postgres
```

### 3. Run Migration

```bash
pnpm prisma:migrate
```

This will:

- Create the `files` table
- Generate the Prisma Client
- Apply the schema to your database

### 4. View Database (Optional)

```bash
pnpm prisma:studio
```

Opens a web UI at `http://localhost:5555` to browse and edit data.

## 📝 Schema Overview

```prisma
model File {
  id          String   @id @default(cuid())
  objectName  String   @unique
  bucket      String
  etag        String
  versionId   String?
  size        Int
  mimetype    String
  url         String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 💡 Usage in Your Code

The `PrismaService` is globally available. Inject it into any service:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class YourService {
  constructor(private prisma: PrismaService) {}

  async createFile(data: any) {
    return this.prisma.file.create({
      data: {
        objectName: data.objectName,
        bucket: data.bucket,
        etag: data.etag,
        size: data.size,
        mimetype: data.mimetype,
        url: data.url,
      },
    });
  }

  async findFileById(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  async findFileByObjectName(objectName: string) {
    return this.prisma.file.findUnique({
      where: { objectName },
    });
  }

  async deleteFile(id: string) {
    return this.prisma.file.delete({
      where: { id },
    });
  }
}
```

## 🔄 Common Commands

```bash
# Generate Prisma Client after schema changes
pnpm prisma:generate

# Create a new migration
pnpm prisma migrate dev --name your_migration_name

# Apply migrations in production
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset

# View database in browser
pnpm prisma:studio

# Format schema file
pnpm prisma format
```

## 📦 Next Steps

1. Fix the database credentials in `.env`
2. Run `pnpm prisma:migrate` to create the tables
3. Update your `FilesService` to persist file metadata to the database
4. Test the integration

## 🔗 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS + Prisma Guide](https://docs.nestjs.com/recipes/prisma)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
