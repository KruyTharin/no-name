import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpClientModule } from './http-client';
import { DemoController } from './demo.controller';
import { ExampleApiService } from './examples/example-api.service';
import { MinioModule } from './modules/minio/minio.module';
import { ConfigModule } from '@nestjs/config';
import { FileModule } from './modules/file/file.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HttpClientModule,
    MinioModule,
    FileModule,
    UserModule,
  ],
  controllers: [AppController, DemoController],
  providers: [AppService, ExampleApiService],
})
export class AppModule {}
