import { Module, Global } from '@nestjs/common';
import { HttpClientService } from './http-client.service';

/**
 * HTTP Client Module
 * 
 * This is a global module, so you don't need to import it in every module.
 * Just import it once in AppModule and use HttpClientService anywhere.
 */
@Global()
@Module({
    providers: [
        {
            provide: HttpClientService,
            useFactory: () => {
                // Configure default settings here
                return new HttpClientService({
                    timeout: 15000, // 15 seconds
                    retries: 3,
                    retryDelay: 1000,
                    headers: {
                        'User-Agent': 'DailyClip/1.0',
                    },
                });
            },
        },
    ],
    exports: [HttpClientService],
})
export class HttpClientModule { }
