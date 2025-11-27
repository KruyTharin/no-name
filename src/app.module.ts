import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpClientModule } from './http-client';
import { DemoController } from './demo.controller';
import { ExampleApiService } from './examples/example-api.service';

@Module({
  imports: [HttpClientModule],
  controllers: [AppController, DemoController],
  providers: [AppService, ExampleApiService],
})
export class AppModule { }


