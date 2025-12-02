import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '@common/interfaces/paginated-result.interface';

export interface PaginationResponse<T> {
  data?: T[];
  total?: number;
  page?: number;
  totalPages?: number;
}

@Injectable()
export class PaginationInterceptor<T>
  implements NestInterceptor<PaginationResponse<T>, PaginatedResult<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<PaginatedResult<T>> {
    const request = context.switchToHttp().getRequest();
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '10', 10);

    return next.handle().pipe(
      map((response: PaginationResponse<T>) => {
        // If response is already in the correct format, check if it has pagination data
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'total' in response
        ) {
          const { data, total, page: responsePage, totalPages } = response;
          const currentPage = responsePage || page;
          const totalCount = total || 0;
          const total_pages = totalPages || Math.ceil(totalCount / limit);

          return {
            data: data || [],
            meta: {
              total: totalCount,
              page: currentPage,
              limit,
              totalPages: total_pages,
              hasNextPage: currentPage < total_pages,
              hasPreviousPage: currentPage > 1,
            },
          };
        }

        // If response is an array, treat it as simple pagination
        if (Array.isArray(response)) {
          return {
            data: response,
            meta: {
              total: response.length,
              page,
              limit,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          };
        }

        // Return as-is if not paginated
        return response as PaginatedResult<T>;
      }),
    );
  }
}
