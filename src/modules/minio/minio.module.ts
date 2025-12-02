import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { MINIO_TOKEN } from 'src/decorators/minio.decorator';

@Global()
@Module({
  providers: [
    {
      inject: [ConfigService],
      provide: MINIO_TOKEN,
      useFactory: (configService: ConfigService): Minio.Client => {
        const client = new Minio.Client({
          endPoint: configService.getOrThrow('MINIO_ENDPOINT'),
          port: Number(configService.getOrThrow('MINIO_PORT')),
          useSSL: false,
          accessKey: configService.getOrThrow('MINIO_ROOT_USER'),
          secretKey: configService.getOrThrow('MINIO_ROOT_PASSWORD'),
        });

        return client;
      },
    },
  ],
  exports: [MINIO_TOKEN],
})
export class MinioModule {}
