import { GET } from '../user/route';
import { NextRequest } from 'next/server';

// Firebase Admin SDKのモック
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
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

describe('GET /api/auth/user', () => {
  const mockVerifyIdToken = require('@/lib/firebase-admin').verifyIdToken;
  const mockFirestore = require('@/lib/firebase-admin').getFirestore;
  const mockExtractBearerToken = require('@/lib/auth-utils').extractBearerToken;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    test('一般ユーザーの情報取得成功', async () => {
      // Given: 有効なAuthorizationヘッダー + 一般ユーザー
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
        name: 'Test User',
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          email: 'user@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: { toDate: () => new Date('2024-01-01') },
          lastLoginAt: { toDate: () => new Date('2024-09-20') },
          isActive: true,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: ユーザー情報取得成功
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toEqual({
        uid: 'user123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: expect.any(String),
        lastLoginAt: expect.any(String),
        isActive: true,
      });
    });

    test('管理者ユーザーの情報取得成功', async () => {
      // Given: 有効なAuthorizationヘッダー + 管理者ユーザー
      const validToken = 'admin-firebase-id-token';
      const mockDecodedToken = {
        uid: 'admin123',
        email: 'admin@example.com',
        name: 'Admin User',
      };

      const mockAdminDoc = {
        exists: true,
        data: () => ({
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: { toDate: () => new Date('2024-01-01') },
          lastLoginAt: { toDate: () => new Date('2024-09-20') },
          isActive: true,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockAdminDoc),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 管理者情報取得成功
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.role).toBe('admin');
      expect(data.user.email).toBe('admin@example.com');
    });

    test('lastLogoutAtがあるユーザーの情報取得', async () => {
      // Given: ログアウト履歴があるユーザー
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
        name: 'Test User',
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          email: 'user@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: { toDate: () => new Date('2024-01-01') },
          lastLoginAt: { toDate: () => new Date('2024-09-20') },
          lastLogoutAt: { toDate: () => new Date('2024-09-19') },
          isActive: true,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: lastLogoutAtも含めて取得成功
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.lastLogoutAt).toBeDefined();
    });

    test('非アクティブユーザーの情報取得', async () => {
      // Given: 非アクティブなユーザー
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'inactive123',
        email: 'inactive@example.com',
        name: 'Inactive User',
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          email: 'inactive@example.com',
          name: 'Inactive User',
          role: 'user',
          createdAt: { toDate: () => new Date('2024-01-01') },
          lastLoginAt: { toDate: () => new Date('2024-09-01') },
          isActive: false,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 非アクティブユーザーも情報取得成功
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.isActive).toBe(false);
    });
  });

  describe('異常系', () => {
    test('Authorizationヘッダーなし', async () => {
      // Given: Authorizationヘッダーなし
      mockExtractBearerToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 401エラー + 認証エラー
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('認証が必要です');
    });

    test('無効なAuthorizationヘッダー形式', async () => {
      // Given: 無効なAuthorizationヘッダー形式
      mockExtractBearerToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: 'InvalidFormat token123',
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 401エラー + 認証エラー
      expect(response.status).toBe(401);
    });

    test('無効なID Token', async () => {
      // Given: 無効なID Token
      const invalidToken = 'invalid-token';

      mockExtractBearerToken.mockReturnValue(invalidToken);
      mockVerifyIdToken.mockRejectedValue(new Error('invalid-id-token'));

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${invalidToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 401エラー + 無効なトークンエラー
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('invalid-id-token');
    });

    test('期限切れID Token', async () => {
      // Given: 期限切れのID Token
      const expiredToken = 'expired-token';

      const authError = new Error('Firebase ID token has expired');
      (authError as any).code = 'auth/id-token-expired';

      mockExtractBearerToken.mockReturnValue(expiredToken);
      mockVerifyIdToken.mockRejectedValue(authError);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${expiredToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 401エラー + 期限切れエラー
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Firebase ID token has expired');
    });

    test('存在しないユーザー', async () => {
      // Given: 有効なトークン + 存在しないユーザー
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'nonexistent-user',
        email: 'nonexistent@example.com',
      };

      const mockUserDoc = {
        exists: false,
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 404エラー + ユーザー不存在エラー
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('ユーザーが見つかりません');
    });
  });

  describe('エラーハンドリング', () => {
    test('Firestore接続エラー', async () => {
      // Given: 有効なトークン + Firestore接続エラー
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest
          .fn()
          .mockRejectedValue(new Error('Firestore connection failed')),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 500エラー + データベースエラー
      expect(response.status).toBe(500);
    });

    test('データ形式不正エラー', async () => {
      // Given: 有効なトークン + 不正なデータ形式
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          // 必要なフィールドが不足
          email: 'user@example.com',
          // nameがない
          // roleがない
          isActive: true,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ユーザー情報取得APIを呼び出す
      const response = await GET(request);

      // Then: 500エラー + データ形式エラー
      expect(response.status).toBe(500);
    });
  });
});
