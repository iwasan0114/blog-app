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
export type UpdateType<T> = Partial<WithoutId<WithoutTimestamps<T>>>;

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
