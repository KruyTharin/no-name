# No-Name

A NestJS application with PostgreSQL, Prisma, and MinIO for file storage.

## Description

NestJS application with modular architecture, database management via Prisma, and object storage using MinIO.

## Features

- ✅ NestJS framework with TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ MinIO object storage for file uploads
- ✅ Docker & Docker Compose for deployment
- ✅ Modular architecture with separate service configurations
- ✅ API documentation with Swagger
- ✅ Pagination support
- ✅ Environment-based configuration

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v20 or higher)
- [pnpm](https://pnpm.io/) package manager

## Environment Setup

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Update the environment variables in `.env`:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=no-name
POSTGRES_PORT=5439
DATABASE_URL="postgresql://postgres:postgres@localhost:5439/no-name?schema=public"

# Server
PORT=3000
NODE_ENV=development

# MinIO
MINIO_PORT=9000
MINIO_CONSOLE_PORT=8000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password
MINIO_BUCKET_NAME=no-name
MINIO_ENDPOINT=localhost
MINIO_PUBLIC_URL=http://localhost:9000
```

## Project Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate
```

## Development

### Option 1: Run with Docker (Recommended)

```bash
# Start all services (app, PostgreSQL, MinIO)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Run Locally

```bash
# Start PostgreSQL only
docker-compose -f docker-compose.postgres.yml up -d

# Start MinIO only
docker-compose -f docker-compose.minio.yml up -d

# Run the application in development mode
pnpm run start:dev
```

### Modular Service Management

Run services individually based on your needs:

```bash
# PostgreSQL only
docker-compose -f docker-compose.postgres.yml up -d

# MinIO only
docker-compose -f docker-compose.minio.yml up -d

# PostgreSQL + MinIO
docker-compose -f docker-compose.postgres.yml -f docker-compose.minio.yml up -d

# Full stack (app + all services)
docker-compose up -d
```

## Database Management

```bash
# Generate Prisma Client
pnpm prisma:generate

# Create and apply migrations
pnpm prisma:migrate

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Seed database (if seed script exists)
pnpm prisma:seed
```

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Deployment

### Docker Production Deployment

1. **Build the Docker image:**

```bash
docker build -t no-name-app .
```

2. **Run with Docker Compose:**

```bash
# Production mode
NODE_ENV=production docker-compose up -d
```

3. **Environment variables for production:**

Update your `.env` file with production values:

- Use strong passwords for `POSTGRES_PASSWORD` and `MINIO_ROOT_PASSWORD`
- Update `DATABASE_URL` to point to your production database
- Set `NODE_ENV=production`
- Update `MINIO_ENDPOINT` and `MINIO_PUBLIC_URL` to production URLs

### Manual Production Deployment

1. **Build the application:**

```bash
pnpm install --prod
pnpm prisma:generate
pnpm build
```

2. **Run migrations:**

```bash
pnpm prisma migrate deploy
```

3. **Start the application:**

```bash
NODE_ENV=production pnpm run start:prod
```

### Cloud Deployment Options

#### Using Railway/Render/Heroku

1. Connect your Git repository
2. Set environment variables in the platform dashboard
3. Add build command: `pnpm install && pnpm prisma:generate && pnpm build`
4. Add start command: `pnpm prisma migrate deploy && pnpm run start:prod`

#### Using AWS/GCP/Azure

1. Build and push Docker image to container registry:

```bash
docker build -t your-registry/no-name-app:latest .
docker push your-registry/no-name-app:latest
```

2. Deploy using container service (ECS, Cloud Run, Container Apps)
3. Set up managed PostgreSQL database
4. Set up object storage (S3, Cloud Storage, Blob Storage) or self-hosted MinIO

### Health Checks

The application includes health check endpoints:

```bash
# Check application health
curl http://localhost:3000/health

# Check API documentation
curl http://localhost:3000/api
```

## Access Services

- **Application:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api
- **MinIO Console:** http://localhost:8000
- **Prisma Studio:** Run `pnpm prisma:studio`

## Troubleshooting

### Database connection issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker-compose -f docker-compose.postgres.yml logs -f

# Reset database (⚠️ WARNING: Deletes all data)
docker-compose -f docker-compose.postgres.yml down -v
docker-compose -f docker-compose.postgres.yml up -d
```

### MinIO connection issues

```bash
# Check if MinIO is running
docker ps | grep minio

# View MinIO logs
docker-compose -f docker-compose.minio.yml logs -f

# Reset MinIO (⚠️ WARNING: Deletes all files)
docker-compose -f docker-compose.minio.yml down -v
docker-compose -f docker-compose.minio.yml up -d
```

### Application issues

```bash
# View application logs
docker-compose logs -f app

# Rebuild application container
docker-compose up -d --build app

# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Project Structure

```
├── prisma/              # Database schema and migrations
├── src/
│   ├── common/          # Shared utilities, decorators, interceptors
│   ├── modules/         # Feature modules
│   │   ├── user/        # User module
│   │   ├── file/        # File upload module
│   │   ├── http-client/ # HTTP client module
│   │   └── minio/       # MinIO integration
│   ├── prisma/          # Prisma service
│   └── main.ts          # Application entry point
├── test/                # E2E tests
├── docker-compose.yml           # Full stack deployment
├── docker-compose.postgres.yml  # PostgreSQL only
├── docker-compose.minio.yml     # MinIO only
├── Dockerfile                   # Production container
└── .env                         # Environment variables
```

## License

This project is [MIT licensed](LICENSE).
