import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationParams => {
    const request = ctx.switchToHttp().getRequest();
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '10', 10);

    // Ensure page is at least 1
    const validPage = page < 1 ? 1 : page;
    // Ensure limit is between 1 and 100
    const validLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;

    return {
      page: validPage,
      limit: validLimit,
      skip: (validPage - 1) * validLimit,
    };
  },
);
