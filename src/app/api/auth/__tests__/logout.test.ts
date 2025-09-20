import { POST } from '../logout/route';
import { NextRequest } from 'next/server';

// Firebase Admin SDKのモック
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
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

describe('POST /api/auth/logout', () => {
  const mockVerifyIdToken = require('@/lib/firebase-admin').verifyIdToken;
  const mockFirestore = require('@/lib/firebase-admin').getFirestore;
  const mockExtractBearerToken = require('@/lib/auth-utils').extractBearerToken;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    test('有効なAuthorizationヘッダーでログアウト成功', async () => {
      // Given: 有効なAuthorizationヘッダー
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          email: 'user@example.com',
          name: 'Test User',
          isActive: true,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

      // Then: ログアウト成功
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('ログアウトしました');
      expect(mockDoc.update).toHaveBeenCalledWith({
        lastLogoutAt: expect.any(Date),
      });
    });

    test('既にログアウト済みのユーザーでも成功', async () => {
      // Given: 有効なトークン + 既にログアウト済み
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          email: 'user@example.com',
          name: 'Test User',
          lastLogoutAt: { toDate: () => new Date() },
          isActive: true,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

      // Then: ログアウト成功（重複実行も許可）
      expect(response.status).toBe(200);
      expect(mockDoc.update).toHaveBeenCalledWith({
        lastLogoutAt: expect.any(Date),
      });
    });
  });

  describe('異常系', () => {
    test('Authorizationヘッダーなし', async () => {
      // Given: Authorizationヘッダーなし
      mockExtractBearerToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

      // Then: 401エラー + 認証エラー
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('認証が必要です');
    });

    test('無効なAuthorizationヘッダー形式', async () => {
      // Given: 無効なAuthorizationヘッダー形式
      mockExtractBearerToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'InvalidFormat token123',
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

      // Then: 401エラー + 認証エラー
      expect(response.status).toBe(401);
    });

    test('無効なID Token', async () => {
      // Given: 無効なID Token
      const invalidToken = 'invalid-token';

      mockExtractBearerToken.mockReturnValue(invalidToken);
      mockVerifyIdToken.mockRejectedValue(new Error('invalid-id-token'));

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${invalidToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

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

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${expiredToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

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

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

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

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

      // Then: 500エラー + データベースエラー
      expect(response.status).toBe(500);
    });

    test('ログアウト時刻更新失敗', async () => {
      // Given: 有効なトークン + ログアウト時刻更新失敗
      const validToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          email: 'user@example.com',
          name: 'Test User',
          isActive: true,
        }),
      };

      mockExtractBearerToken.mockReturnValue(validToken);
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
        update: jest.fn().mockRejectedValue(new Error('Permission denied')),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      // When: ログアウトAPIを呼び出す
      const response = await POST(request);

      // Then: 500エラー + 更新エラー
      expect(response.status).toBe(500);
    });
  });
});
