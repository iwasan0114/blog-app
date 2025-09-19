import { Blog, Member } from './entities';
import {
  CreateBlogRequest,
  UpdateBlogRequest,
  BlogSearchQuery,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberSearchQuery,
  PaginationInfo,
} from './api';
import { UploadResult, UploadProgress } from './firebase';
import { AppError } from './utils';

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
