import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';

// Firebase Admin SDKのモック
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
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
  validateUpdateBlogRequest: jest.fn(),
  sanitizeText: jest.fn(text => text),
  canAccessBlog: jest.fn(),
  canEditBlog: jest.fn(),
}));

describe('Blog Detail API (/api/blogs/[id])', () => {
  const mockVerifyIdToken = require('@/lib/firebase-admin').verifyIdToken;
  const mockFirestore = require('@/lib/firebase-admin').getFirestore;
  const mockExtractBearerToken = require('@/lib/auth-utils').extractBearerToken;
  const mockValidateUpdateBlogRequest =
    require('@/lib/blog-utils').validateUpdateBlogRequest;
  const mockCanAccessBlog = require('@/lib/blog-utils').canAccessBlog;
  const mockCanEditBlog = require('@/lib/blog-utils').canEditBlog;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/blogs/[id] (ブログ詳細取得)', () => {
    test('TC-012: 認証済みユーザーによる公開ブログ詳細取得', async () => {
      // Given: 有効なJWTトークンと公開ブログ
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };
      const blogId = 'blog123';

      const mockBlogData = {
        title: 'テストブログ',
        content: 'テスト内容',
        status: 'published',
        authorId: 'user456',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockCanAccessBlog.mockReturnValue(true);

      const mockDoc = {
        exists: true,
        id: blogId,
        data: () => mockBlogData,
      };

      const mockCollection = {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockDoc),
        })),
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest(
        `http://localhost:3000/api/blogs/${blogId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: GET /api/blogs/[id] を呼び出す
      const response = await GET(request, { params: { id: blogId } });

      // Then: ブログ詳細を返す
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.blog.id).toBe(blogId);
      expect(data.blog.title).toBe(mockBlogData.title);
    });

    test('TC-013: 存在しないブログへのアクセス', async () => {
      // Given: 有効な認証と存在しないブログID
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };
      const blogId = 'nonexistent-blog';

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = { exists: false };
      const mockCollection = {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockDoc),
        })),
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest(
        `http://localhost:3000/api/blogs/${blogId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: 存在しないブログにアクセス
      const response = await GET(request, { params: { id: blogId } });

      // Then: 404エラー
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('ブログが見つかりません');
    });

    test('TC-014: 下書きブログへの権限なしアクセス', async () => {
      // Given: 他人の下書きブログ
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };
      const blogId = 'draft-blog';

      const mockBlogData = {
        title: 'ドラフトブログ',
        content: 'ドラフト内容',
        status: 'draft',
        authorId: 'user456',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockCanAccessBlog.mockReturnValue(false);

      const mockDoc = {
        exists: true,
        id: blogId,
        data: () => mockBlogData,
      };

      const mockCollection = {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockDoc),
        })),
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest(
        `http://localhost:3000/api/blogs/${blogId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: 権限のない下書きブログにアクセス
      const response = await GET(request, { params: { id: blogId } });

      // Then: 403エラー
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('アクセスする権限がありません');
    });
  });

  describe('PUT /api/blogs/[id] (ブログ更新)', () => {
    test('TC-015: 認証済み作成者によるブログ更新', async () => {
      // Given: 有効な認証と更新データ
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };
      const blogId = 'blog123';

      const updateData = {
        title: '更新されたタイトル',
        content: '更新された内容',
        status: 'published',
      };

      const existingBlogData = {
        title: '元のタイトル',
        content: '元の内容',
        status: 'draft',
        authorId: 'user123',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      };

      const updatedBlogData = {
        ...existingBlogData,
        ...updateData,
        updatedAt: { toDate: () => new Date() },
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateUpdateBlogRequest.mockReturnValue({
        isValid: true,
        missingFields: [],
      });
      mockCanEditBlog.mockReturnValue(true);

      const mockExistingDoc = {
        exists: true,
        data: () => existingBlogData,
      };

      const mockUpdatedDoc = {
        id: blogId,
        data: () => updatedBlogData,
      };

      const mockDocRef = {
        get: jest
          .fn()
          .mockResolvedValueOnce(mockExistingDoc)
          .mockResolvedValueOnce(mockUpdatedDoc),
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDocRef),
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest(
        `http://localhost:3000/api/blogs/${blogId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      // When: PUT /api/blogs/[id] を呼び出す
      const response = await PUT(request, { params: { id: blogId } });

      // Then: ブログが更新される
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.blog.title).toBe(updateData.title);
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updateData.title,
          content: updateData.content,
          status: updateData.status,
        })
      );
    });

    test('TC-016: 権限なしユーザーによるブログ更新試行', async () => {
      // Given: 他人のブログへの更新試行
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };
      const blogId = 'blog456';

      const existingBlogData = {
        title: '他人のブログ',
        content: '他人の内容',
        status: 'published',
        authorId: 'user456', // 異なるユーザー
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockValidateUpdateBlogRequest.mockReturnValue({
        isValid: true,
        missingFields: [],
      });
      mockCanEditBlog.mockReturnValue(false);

      const mockExistingDoc = {
        exists: true,
        data: () => existingBlogData,
      };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(mockExistingDoc),
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDocRef),
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest(
        `http://localhost:3000/api/blogs/${blogId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: '更新試行' }),
        }
      );

      // When: 権限のないブログを更新試行
      const response = await PUT(request, { params: { id: blogId } });

      // Then: 403エラー
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('編集する権限がありません');
    });
  });

  describe('DELETE /api/blogs/[id] (ブログ削除)', () => {
    test('TC-017: 認証済み作成者によるブログ削除', async () => {
      // Given: 有効な認証と削除権限
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };
      const blogId = 'blog123';

      const existingBlogData = {
        title: 'テストブログ',
        content: 'テスト内容',
        status: 'published',
        authorId: 'user123',
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockCanEditBlog.mockReturnValue(true);

      const mockExistingDoc = {
        exists: true,
        data: () => existingBlogData,
      };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(mockExistingDoc),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDocRef),
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest(
        `http://localhost:3000/api/blogs/${blogId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: DELETE /api/blogs/[id] を呼び出す
      const response = await DELETE(request, { params: { id: blogId } });

      // Then: ブログが削除される
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('削除されました');
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    test('TC-018: 権限なしユーザーによるブログ削除試行', async () => {
      // Given: 他人のブログへの削除試行
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = { uid: 'user123' };
      const blogId = 'blog456';

      const existingBlogData = {
        title: '他人のブログ',
        content: '他人の内容',
        status: 'published',
        authorId: 'user456', // 異なるユーザー
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockCanEditBlog.mockReturnValue(false);

      const mockExistingDoc = {
        exists: true,
        data: () => existingBlogData,
      };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(mockExistingDoc),
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDocRef),
      };

      const mockFirestoreInstance = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };
      mockFirestore.mockReturnValue(mockFirestoreInstance);

      const request = new NextRequest(
        `http://localhost:3000/api/blogs/${blogId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // When: 権限のないブログを削除試行
      const response = await DELETE(request, { params: { id: blogId } });

      // Then: 403エラー
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('削除する権限がありません');
    });
  });
});
