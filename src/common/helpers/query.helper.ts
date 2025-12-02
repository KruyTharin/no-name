export abstract class QueryHelper {
  /**
   * Calculate pagination options from DTO
   */
  static getPaginationOptions(dto: { page?: number; limit?: number }): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Build pagination metadata
   */
  static buildMeta(options: { page: number; limit: number; total: number }): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } {
    const { page, limit, total } = options;
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Build Prisma orderBy clause
   */
  static buildOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Record<string, 'asc' | 'desc'> {
    if (!sortBy) {
      return { createdAt: sortOrder };
    }

    return { [sortBy]: sortOrder };
  }

  /**
   * Build search where clause for multiple fields
   */
  static buildSearchWhere(
    searchTerm: string | undefined,
    fields: string[],
  ): any {
    if (!searchTerm || fields.length === 0) {
      return {};
    }

    return {
      OR: fields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
      })),
    };
  }

  /**
   * Build date range where clause
   */
  static buildDateRangeWhere(
    startDate?: string,
    endDate?: string,
    field: string = 'createdAt',
  ): any {
    const where: any = {};

    if (startDate || endDate) {
      where[field] = {};

      if (startDate) {
        where[field].gte = new Date(startDate);
      }

      if (endDate) {
        where[field].lte = new Date(endDate);
      }
    }

    return where;
  }
}
