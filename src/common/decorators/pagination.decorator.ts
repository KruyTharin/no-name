import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationParams => {
    const query = ctx.switchToHttp().getRequest().query;

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));

    const reservedKeys = ['page', 'limit', 'sort', 'order', 'search'];
    const filters: Record<string, any> = Object.keys(query)
      .filter((key) => !reservedKeys.includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: query[key] }), {});

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      sort: query.sort,
      order: query.order === 'asc' ? 'asc' : 'desc',
      search: query.search,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  },
);
