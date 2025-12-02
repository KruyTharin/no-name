import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpClientModule } from './http-client';
import { DemoController } from './demo.controller';
import { ExampleApiService } from './examples/example-api.service';
import { MinioModule } from './modules/minio/minio.module';
import { ConfigModule } from '@nestjs/config';
import { FileModule } from './modules/file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpClientModule,
    MinioModule,
    FileModule,
  ],
  controllers: [AppController, DemoController],
  providers: [AppService, ExampleApiService],
})
export class AppModule {}
