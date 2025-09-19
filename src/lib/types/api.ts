import { Blog, Member, User } from './entities';
import { BlogStatus, MemberCategory, MemberPosition } from './enums';

/**
 * 共通APIレスポンス
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// ===============================
// ブログ関連API型
// ===============================

/**
 * ブログ記事作成リクエスト
 */
export interface CreateBlogRequest {
  title: string;
  content: string;
  status: BlogStatus;
  imageUrl?: string;
}

/**
 * ブログ記事更新リクエスト
 */
export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  status?: BlogStatus;
  imageUrl?: string;
}

/**
 * ブログ記事検索クエリ
 */
export interface BlogSearchQuery {
  status?: BlogStatus;
  keyword?: string;
  authorId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * ブログ記事一覧レスポンス
 */
export interface BlogListResponse extends PaginatedResponse<Blog> {}

// ===============================
// メンバー関連API型
// ===============================

/**
 * メンバー作成リクエスト
 */
export interface CreateMemberRequest {
  name: string;
  category: MemberCategory;
  position: MemberPosition;
  description: string;
  profileImageUrl?: string;
  isActive?: boolean;
}

/**
 * メンバー更新リクエスト
 */
export interface UpdateMemberRequest {
  name?: string;
  category?: MemberCategory;
  position?: MemberPosition;
  description?: string;
  profileImageUrl?: string;
  isActive?: boolean;
}

/**
 * メンバー検索クエリ
 */
export interface MemberSearchQuery {
  isActive?: boolean;
  category?: MemberCategory;
  position?: MemberPosition;
  keyword?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'position';
  sortOrder?: 'asc' | 'desc';
}

/**
 * メンバー一覧レスポンス
 */
export interface MemberListResponse extends PaginatedResponse<Member> {}

// ===============================
// 認証関連型
// ===============================

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * ログインレスポンス
 */
export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

/**
 * 認証コンテキスト
 */
export interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
