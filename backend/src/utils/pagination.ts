export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getPagination(pageVal?: number | string, limitVal?: number | string) {
  const page = pageVal ? Math.max(1, Number(pageVal)) : 1;
  const limit = limitVal ? Math.max(1, Number(limitVal)) : 10;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages
    }
  };
}
