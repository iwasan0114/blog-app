import { GET } from '../route';
import { NextRequest } from 'next/server';

// Firebase Admin SDKのモック
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      get: jest.fn(),
    })),
  })),
}));

// Auth utilsのモック
jest.mock('@/lib/auth-utils', () => ({
  extractBearerToken: jest.fn(),
  createErrorResponse: jest.fn(
    (error, status = 500) =>
      new Response(
        JSON.stringify({ success: false, error: error.message || error }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
  ),
  createSuccessResponse: jest.fn(
    (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
  ),
}));

// Blog utilsのモック
jest.mock('@/lib/blog-utils', () => ({
  validateBlogListQuery: jest.fn(),
  calculatePagination: jest.fn(),
}));

describe('GET /api/blogs (ブログ一覧取得)', () => {
  const mockVerifyIdToken = require('@/lib/firebase-admin').verifyIdToken;
  const mockFirestore = require('@/lib/firebase-admin').getFirestore;
  const mockExtractBearerToken = require('@/lib/auth-utils').extractBearerToken;
  const mockValidateBlogListQuery =
    require('@/lib/blog-utils').validateBlogListQuery;
  const mockCalculatePagination =
    require('@/lib/blog-utils').calculatePagination;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    test('TC-001: 認証済みユーザーによる基本一覧取得', async () => {
      // Given: 有効なJWTトークンを持つユーザー
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
      };

      const mockBlogs = [
        {
          id: 'blog1',
          title: 'テストブログ1',
          content: 'テスト内容1',
          status: 'published',
          authorId: 'user123',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        },
        {
          id: 'blog2',
          title: 'テストブログ2',
          content: 'テスト内容2',
          status: 'published',
          authorId: 'user456',
          createdAt: { toDate: () => new Date('2024-01-02') },
          updatedAt: { toDate: () => new Date('2024-01-02') },
        },
      ];

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateBlogListQuery.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      const mockCollectionForQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: mockBlogs.map(blog => ({
            id: blog.id,
            data: () => blog,
          })),
          size: mockBlogs.length,
        }),
      };

      const mockCollectionForTotal = {
        get: jest.fn().mockResolvedValue({
          size: 2,
        }),
      };

      const mockFirestoreInstance = {
        collection: jest
          .fn()
          .mockReturnValueOnce(mockCollectionForQuery)
          .mockReturnValueOnce(mockCollectionForTotal),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);
      mockCalculatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });

      const request = new NextRequest('http://localhost:3000/api/blogs', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: GET /api/blogs を呼び出す
      const response = await GET(request);

      // Then: ブログ一覧と総数を返す
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.blogs).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    test('TC-002: ページネーション機能', async () => {
      // Given: 20件のブログが存在
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateBlogListQuery.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      const mockBlogs = Array.from({ length: 5 }, (_, i) => ({
        id: `blog${i + 6}`,
        title: `ブログ${i + 6}`,
        content: `内容${i + 6}`,
        status: 'published',
        authorId: 'user123',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      }));

      const mockCollectionForQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: mockBlogs.map(blog => ({
            id: blog.id,
            data: () => blog,
          })),
          size: 5,
        }),
      };

      const mockCollectionForTotal = {
        get: jest.fn().mockResolvedValue({
          size: 20,
        }),
      };

      const mockFirestoreInstance = {
        collection: jest
          .fn()
          .mockReturnValueOnce(mockCollectionForQuery)
          .mockReturnValueOnce(mockCollectionForTotal),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);
      mockCalculatePagination.mockReturnValue({
        page: 2,
        limit: 5,
        total: 20,
        totalPages: 4,
        hasNext: true,
        hasPrev: true,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/blogs?page=2&limit=5',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: limit=5&page=2 でリクエスト
      const response = await GET(request);

      // Then: 6-10件目のブログを返す
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.hasNext).toBe(true);
      expect(data.pagination.hasPrev).toBe(true);
    });

    test('TC-003: タイトル検索機能', async () => {
      // Given: 検索可能なブログが存在
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateBlogListQuery.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      const mockBlogs = [
        {
          id: 'blog1',
          title: 'テストについて',
          content: '内容',
          status: 'published',
          authorId: 'user123',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        },
      ];

      const mockCollectionForQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: mockBlogs.map(blog => ({
            id: blog.id,
            data: () => blog,
          })),
        }),
      };

      const mockCollectionForTotal = {
        get: jest.fn().mockResolvedValue({
          size: 1,
        }),
      };

      const mockFirestoreInstance = {
        collection: jest
          .fn()
          .mockReturnValueOnce(mockCollectionForQuery)
          .mockReturnValueOnce(mockCollectionForTotal),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);
      mockCalculatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/blogs?search=テスト',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: search=テスト でリクエスト
      const response = await GET(request);

      // Then: タイトルに「テスト」を含むブログのみ返す
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.blogs).toHaveLength(1);
      expect(data.blogs[0].title).toContain('テスト');
    });
  });

  describe('異常系', () => {
    test('TC-005: 認証なしアクセス', async () => {
      // Given: 認証トークンなし
      mockExtractBearerToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/blogs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // When: GET /api/blogs を呼び出す
      const response = await GET(request);

      // Then: 401エラー「認証が必要です」
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('認証が必要です');
    });

    test('TC-006: 無効なページネーションパラメータ', async () => {
      // Given: 有効な認証
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateBlogListQuery.mockReturnValue({
        isValid: false,
        missingFields: ['limit must be between 1 and 100'],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/blogs?limit=-1',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: limit=-1 でリクエスト
      const response = await GET(request);

      // Then: 400エラー「無効なパラメータ」
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('無効なパラメータ');
    });
  });
});
