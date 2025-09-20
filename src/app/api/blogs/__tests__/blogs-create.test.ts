import { POST } from '../route';
import { NextRequest } from 'next/server';

// Firebase Admin SDKのモック
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
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
  validateCreateBlogRequest: jest.fn(),
  sanitizeText: jest.fn(text => text),
}));

describe('POST /api/blogs (ブログ作成)', () => {
  const mockVerifyIdToken = require('@/lib/firebase-admin').verifyIdToken;
  const mockFirestore = require('@/lib/firebase-admin').getFirestore;
  const mockExtractBearerToken = require('@/lib/auth-utils').extractBearerToken;
  const mockValidateCreateBlogRequest =
    require('@/lib/blog-utils').validateCreateBlogRequest;
  const mockSanitizeText = require('@/lib/blog-utils').sanitizeText;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    test('TC-007: 認証済みユーザーによる新規ブログ作成', async () => {
      // Given: 有効なJWTトークンと正しいブログデータ
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
      };

      const blogData = {
        title: 'テストブログ',
        content: 'テスト内容です',
        status: 'published',
      };

      const mockCreatedBlog = {
        id: 'blog123',
        ...blogData,
        authorId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateCreateBlogRequest.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      const mockDocRef = { id: 'blog123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockCollection = {
        add: mockAdd,
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest('http://localhost:3000/api/blogs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData),
      });

      // When: POST /api/blogs を呼び出す
      const response = await POST(request);

      // Then: 新規ブログが作成される
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.blog).toBeDefined();
      expect(data.blog.title).toBe(blogData.title);
      expect(data.blog.authorId).toBe(mockDecodedToken.uid);
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: blogData.title,
          content: blogData.content,
          status: blogData.status,
          authorId: mockDecodedToken.uid,
        })
      );
    });

    test('TC-008: 下書きステータスでのブログ作成', async () => {
      // Given: 有効な認証と下書きステータス
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };

      const blogData = {
        title: 'ドラフトブログ',
        content: 'ドラフト内容',
        status: 'draft',
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateCreateBlogRequest.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      const mockDocRef = { id: 'blog456' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockCollection = { add: mockAdd };
      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest('http://localhost:3000/api/blogs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData),
      });

      // When: draft ステータスでPOST /api/blogs を呼び出す
      const response = await POST(request);

      // Then: 下書きブログが作成される
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.blog.status).toBe('draft');
    });
  });

  describe('異常系', () => {
    test('TC-009: 認証なしでのブログ作成', async () => {
      // Given: 認証トークンなし
      mockExtractBearerToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'テスト',
          content: '内容',
          status: 'published',
        }),
      });

      // When: POST /api/blogs を呼び出す
      const response = await POST(request);

      // Then: 401エラー「認証が必要です」
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('認証が必要です');
    });

    test('TC-010: 無効なブログデータでの作成', async () => {
      // Given: 有効な認証と無効なブログデータ
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateCreateBlogRequest.mockReturnValue({
        isValid: false,
        missingFields: ['title', 'content'],
      });

      const request = new NextRequest('http://localhost:3000/api/blogs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '',
          content: '',
          status: 'published',
        }),
      });

      // When: 無効なデータでPOST /api/blogs を呼び出す
      const response = await POST(request);

      // Then: 400エラー「無効なパラメータ」
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('無効なパラメータ');
    });

    test('TC-011: 無効なJSONでのリクエスト', async () => {
      // Given: 有効な認証と無効なJSON
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const request = new NextRequest('http://localhost:3000/api/blogs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      // When: 無効なJSONでPOST /api/blogs を呼び出す
      const response = await POST(request);

      // Then: 400エラー「リクエストデータが無効です」
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('リクエストデータが無効です');
    });
  });
});
