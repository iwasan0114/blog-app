import { BlogStatus, MemberCategory, MemberPosition } from './enums';

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
