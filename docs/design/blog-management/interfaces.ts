// ===============================
// エンティティ型定義
// ===============================

/**
 * ブログ記事のステータス
 */
export type BlogStatus = 'draft' | 'published';

/**
 * メンバーのカテゴリ
 */
export enum MemberCategory {
  TEACHER = 'teacher',
  STUDENT = 'student'
}

/**
 * 先生の職位
 */
export enum TeacherPosition {
  PROFESSOR = '教授',
  ASSOCIATE_PROFESSOR = '准教授',
  ASSISTANT_PROFESSOR = '助教',
  LECTURER = '講師'
}

/**
 * 学生の学年
 */
export enum StudentPosition {
  DOCTORAL = '博士',
  MASTER = '修士',
  UNDERGRADUATE = '学部生',
  RESEARCH_STUDENT = '研究生'
}

/**
 * 全メンバーの職位・学年（Union型）
 */
export type MemberPosition = TeacherPosition | StudentPosition;

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
 * メンバーエンティティ
 */
export interface Member {
  id: string;
  name: string;
  category: MemberCategory;
  position: MemberPosition;
  description: string;
  profileImageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 管理者ユーザーエンティティ
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  createdAt: Date;
  lastLoginAt: Date;
}

// ===============================
// API リクエスト/レスポンス型
// ===============================

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

// ===============================
// フォーム関連型
// ===============================

/**
 * ブログフォームデータ
 */
export interface BlogFormData {
  title: string;
  content: string;
  status: BlogStatus;
  image?: File;
  imageUrl?: string;
}

/**
 * メンバーフォームデータ
 */
export interface MemberFormData {
  name: string;
  category: MemberCategory;
  position: MemberPosition;
  description: string;
  profileImage?: File;
  profileImageUrl?: string;
  isActive: boolean;
}

/**
 * フォームバリデーションエラー
 */
export interface FormValidationError {
  field: string;
  message: string;
}

// ===============================
// メンバー関連定数とマッピング
// ===============================

/**
 * カテゴリ表示名マッピング
 */
export const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  [MemberCategory.TEACHER]: '先生',
  [MemberCategory.STUDENT]: '学生',
};

/**
 * 職位・学年の表示順序（先生）
 */
export const TEACHER_POSITION_ORDER: TeacherPosition[] = [
  TeacherPosition.PROFESSOR,
  TeacherPosition.ASSOCIATE_PROFESSOR,
  TeacherPosition.ASSISTANT_PROFESSOR,
  TeacherPosition.LECTURER,
];

/**
 * 職位・学年の表示順序（学生）
 */
export const STUDENT_POSITION_ORDER: StudentPosition[] = [
  StudentPosition.DOCTORAL,
  StudentPosition.MASTER,
  StudentPosition.UNDERGRADUATE,
  StudentPosition.RESEARCH_STUDENT,
];

/**
 * カテゴリ別の職位・学年オプション
 */
export const POSITION_OPTIONS_BY_CATEGORY = {
  [MemberCategory.TEACHER]: Object.values(TeacherPosition).map(position => ({
    value: position,
    label: position,
  })),
  [MemberCategory.STUDENT]: Object.values(StudentPosition).map(position => ({
    value: position,
    label: position,
  })),
};

/**
 * 全ての職位・学年オプション
 */
export const ALL_POSITION_OPTIONS = [
  ...POSITION_OPTIONS_BY_CATEGORY[MemberCategory.TEACHER],
  ...POSITION_OPTIONS_BY_CATEGORY[MemberCategory.STUDENT],
];

/**
 * カテゴリオプション
 */
export const CATEGORY_OPTIONS = Object.values(MemberCategory).map(category => ({
  value: category,
  label: MEMBER_CATEGORY_LABELS[category],
}));

// ===============================
// Firebase 関連型
// ===============================

/**
 * Firestore ドキュメント基底型
 */
export interface FirestoreDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firebase エラー型
 */
export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

/**
 * ファイルアップロード進捗
 */
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

/**
 * ファイルアップロード結果
 */
export interface UploadResult {
  url: string;
  path: string;
  metadata: {
    size: number;
    contentType: string;
    name: string;
  };
}

// ===============================
// UI コンポーネント関連型
// ===============================

/**
 * テーブル列定義
 */
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

/**
 * ページネーションコンポーネントプロパティ
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  maxButtons?: number;
}

/**
 * 検索フィルターコンポーネントプロパティ
 */
export interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, any>) => void;
  placeholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'checkbox' | 'date';
    options?: Array<{ value: any; label: string }>;
  }>;
}

/**
 * モーダルコンポーネントプロパティ
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

/**
 * 確認ダイアログプロパティ
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

// ===============================
// 設定関連型
// ===============================

/**
 * アプリケーション設定
 */
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  features: {
    blogPreview: boolean;
    memberImport: boolean;
    auditLog: boolean;
  };
  limits: {
    blogTitleMaxLength: number;
    blogContentMaxLength: number;
    memberNameMaxLength: number;
    memberDescriptionMaxLength: number;
    maxFileSize: number;
    allowedImageTypes: string[];
  };
}

// ===============================
// ユーティリティ型
// ===============================

/**
 * 部分的な更新可能型
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * IDを除いた型
 */
export type WithoutId<T> = Omit<T, 'id'>;

/**
 * タイムスタンプを除いた型
 */
export type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;

/**
 * 作成用型（ID・タイムスタンプを除く）
 */
export type CreateType<T> = WithoutId<WithoutTimestamps<T>>;

/**
 * 更新用型（ID・作成日時を除いた部分更新可能型）
 */
export type UpdateType<T> = PartialBy<WithoutId<WithoutTimestamps<T>>, 'updatedAt'>;

// ===============================
// エラー処理関連型
// ===============================

/**
 * アプリケーションエラー型
 */
export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * エラーハンドラー型
 */
export type ErrorHandler = (error: AppError) => void;

/**
 * 非同期操作の状態
 */
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

// ===============================
// フック関連型
// ===============================

/**
 * useBlogsフックの戻り値
 */
export interface UseBlogsReturn {
  blogs: Blog[];
  loading: boolean;
  error: AppError | null;
  pagination: PaginationInfo;
  createBlog: (data: CreateBlogRequest) => Promise<Blog>;
  updateBlog: (id: string, data: UpdateBlogRequest) => Promise<Blog>;
  deleteBlog: (id: string) => Promise<void>;
  searchBlogs: (query: BlogSearchQuery) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useMembersフックの戻り値
 */
export interface UseMembersReturn {
  members: Member[];
  loading: boolean;
  error: AppError | null;
  pagination: PaginationInfo;
  createMember: (data: CreateMemberRequest) => Promise<Member>;
  updateMember: (id: string, data: UpdateMemberRequest) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  searchMembers: (query: MemberSearchQuery) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useFileUploadフックの戻り値
 */
export interface UseFileUploadReturn {
  upload: (file: File, path: string) => Promise<UploadResult>;
  uploadProgress: UploadProgress | null;
  uploading: boolean;
  error: AppError | null;
}

// ===============================
// メンバー関連ヘルパー関数の型
// ===============================

/**
 * 職位からカテゴリを取得する関数の型
 */
export type GetCategoryFromPosition = (position: MemberPosition) => MemberCategory;

/**
 * カテゴリ別にメンバーをグループ化する関数の戻り値型
 */
export interface GroupedMembers {
  [MemberCategory.TEACHER]: Member[];
  [MemberCategory.STUDENT]: Member[];
}

/**
 * メンバーをカテゴリ別にグループ化する関数の型
 */
export type GroupMembersByCategory = (members: Member[]) => GroupedMembers;

// ===============================
// ユーティリティ関数
// ===============================

/**
 * 職位からカテゴリを判定
 */
export const getCategoryFromPosition = (position: MemberPosition): MemberCategory => {
  if (Object.values(TeacherPosition).includes(position as TeacherPosition)) {
    return MemberCategory.TEACHER;
  }
  return MemberCategory.STUDENT;
};

/**
 * カテゴリに応じた職位オプションを取得
 */
export const getPositionOptionsByCategory = (category: MemberCategory) => {
  return POSITION_OPTIONS_BY_CATEGORY[category];
};