import { BlogStatus, MemberCategory, MemberPosition } from './enums';

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
