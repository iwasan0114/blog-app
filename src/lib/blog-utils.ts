import { BlogStatus } from './types/blog';
import { ValidationResult } from './auth-utils';

/**
 * ブログ作成リクエストのバリデーション
 */
export function validateCreateBlogRequest(data: any): ValidationResult {
  const errors: string[] = [];

  if (
    !data.title ||
    typeof data.title !== 'string' ||
    data.title.trim() === ''
  ) {
    errors.push('title');
  }

  if (
    !data.content ||
    typeof data.content !== 'string' ||
    data.content.trim() === ''
  ) {
    errors.push('content');
  }

  if (!data.status || !['draft', 'published'].includes(data.status)) {
    errors.push('status');
  }

  // XSS対策のための基本的なチェック
  if (
    data.title &&
    (data.title.includes('<script>') || data.title.includes('javascript:'))
  ) {
    errors.push('title contains potentially dangerous content');
  }

  if (
    data.content &&
    (data.content.includes('<script>') || data.content.includes('javascript:'))
  ) {
    errors.push('content contains potentially dangerous content');
  }

  return {
    isValid: errors.length === 0,
    missingFields: errors,
  };
}

/**
 * ブログ更新リクエストのバリデーション
 */
export function validateUpdateBlogRequest(data: any): ValidationResult {
  const errors: string[] = [];

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim() === '') {
      errors.push('title');
    }
    if (data.title.includes('<script>') || data.title.includes('javascript:')) {
      errors.push('title contains potentially dangerous content');
    }
  }

  if (data.content !== undefined) {
    if (typeof data.content !== 'string' || data.content.trim() === '') {
      errors.push('content');
    }
    if (
      data.content.includes('<script>') ||
      data.content.includes('javascript:')
    ) {
      errors.push('content contains potentially dangerous content');
    }
  }

  if (
    data.status !== undefined &&
    !['draft', 'published'].includes(data.status)
  ) {
    errors.push('status');
  }

  return {
    isValid: errors.length === 0,
    missingFields: errors,
  };
}

/**
 * クエリパラメータのバリデーション
 */
export function validateBlogListQuery(query: any): ValidationResult {
  const errors: string[] = [];

  if (query.page !== undefined) {
    const page = parseInt(query.page);
    if (isNaN(page) || page < 1) {
      errors.push('page must be a positive integer');
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('limit must be between 1 and 100');
    }
  }

  if (
    query.status !== undefined &&
    !['draft', 'published'].includes(query.status)
  ) {
    errors.push('status must be draft or published');
  }

  return {
    isValid: errors.length === 0,
    missingFields: errors,
  };
}

/**
 * テキストのサニタイズ（基本的なXSS対策）
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * ブログのアクセス権限チェック
 */
export function canAccessBlog(
  blog: { status: BlogStatus; authorId: string },
  user: { id: string; role: string }
): boolean {
  // 公開記事は誰でもアクセス可能
  if (blog.status === 'published') {
    return true;
  }

  // 下書きは作成者または管理者のみアクセス可能
  return blog.authorId === user.id || user.role === 'admin';
}

/**
 * ブログの編集権限チェック
 */
export function canEditBlog(
  blog: { authorId: string },
  user: { id: string; role: string }
): boolean {
  return blog.authorId === user.id || user.role === 'admin';
}

/**
 * ページネーション情報の計算
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
