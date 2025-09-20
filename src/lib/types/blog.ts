/**
 * ブログ記事のステータス
 */
export type BlogStatus = 'draft' | 'published';

/**
 * ブログ記事エンティティ
 */
export interface Blog {
  id: string;
  title: string;
  content: string;
  status: BlogStatus;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

/**
 * ブログ作成リクエスト
 */
export interface CreateBlogRequest {
  title: string;
  content: string;
  status: BlogStatus;
  imageUrl?: string;
}

/**
 * ブログ更新リクエスト
 */
export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  status?: BlogStatus;
  imageUrl?: string;
}

/**
 * ブログ一覧取得クエリパラメータ
 */
export interface BlogListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatus;
  authorId?: string;
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * ブログ一覧レスポンス
 */
export interface BlogListResponse {
  success: boolean;
  blogs: Blog[];
  pagination: PaginationInfo;
}

/**
 * ブログ詳細レスポンス
 */
export interface BlogDetailResponse {
  success: boolean;
  blog: Blog;
}

/**
 * ブログ作成・更新レスポンス
 */
export interface BlogMutationResponse {
  success: boolean;
  blog: Blog;
}

/**
 * ブログ削除レスポンス
 */
export interface BlogDeleteResponse {
  success: boolean;
  message: string;
}

/**
 * エラーレスポンス
 */
export interface BlogErrorResponse {
  success: false;
  error: string;
}
