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
