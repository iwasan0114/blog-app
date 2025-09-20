import { POST } from '../login/route';
import { NextRequest } from 'next/server';

// Firebase Admin SDKのモック
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      })),
    })),
  })),
}));

// Auth utilsのモック
jest.mock('@/lib/auth-utils', () => ({
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
  validateRequiredFields: jest.fn(),
}));

describe('POST /api/auth/login', () => {
  const mockVerifyIdToken = require('@/lib/firebase-admin').verifyIdToken;
  const mockFirestore = require('@/lib/firebase-admin').getFirestore;
  const mockValidateRequiredFields =
    require('@/lib/auth-utils').validateRequiredFields;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    test('有効なID Tokenでログイン成功', async () => {
      // Given: 有効なFirebase ID Token
      const validIdToken = 'valid-firebase-id-token';
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
          isActive: true,
        }),
      };

      mockValidateRequiredFields.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: validIdToken }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: ログイン成功
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('user@example.com');
      expect(mockDoc.update).toHaveBeenCalledWith({
        lastLoginAt: expect.any(Date),
      });
    });

    test('新規ユーザーの初回ログイン', async () => {
      // Given: 有効なID Token + Firestoreにユーザー情報なし
      const validIdToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        name: 'New User',
      };

      const mockUserDoc = {
        exists: false,
      };

      mockValidateRequiredFields.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
        set: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: validIdToken }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 新規ユーザー作成 + ログイン成功
      expect(response.status).toBe(200);
      expect(mockDoc.set).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        createdAt: expect.any(Date),
        lastLoginAt: expect.any(Date),
        isActive: true,
      });
    });

    test('管理者ユーザーのログイン', async () => {
      // Given: 管理者ユーザーのID Token
      const adminIdToken = 'admin-firebase-id-token';
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
          isActive: true,
        }),
      };

      mockValidateRequiredFields.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockAdminDoc),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: adminIdToken }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 管理者でログイン成功
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.role).toBe('admin');
    });
  });

  describe('異常系', () => {
    test('無効なID Tokenでログイン失敗', async () => {
      // Given: 無効なID Token
      const invalidIdToken = 'invalid-token';

      mockValidateRequiredFields.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      mockVerifyIdToken.mockRejectedValue(new Error('invalid-id-token'));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: invalidIdToken }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: ログイン失敗
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('invalid-id-token');
    });

    test('期限切れID Tokenでログイン失敗', async () => {
      // Given: 期限切れのID Token
      const expiredIdToken = 'expired-token';

      const authError = new Error('Firebase ID token has expired');
      (authError as any).code = 'auth/id-token-expired';

      mockValidateRequiredFields.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      mockVerifyIdToken.mockRejectedValue(authError);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: expiredIdToken }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 401エラー + 適切なエラーメッセージ
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Firebase ID token has expired');
    });

    test('空のリクエストボディ', async () => {
      // Given: 空のリクエストボディ
      mockValidateRequiredFields.mockReturnValue({
        isValid: false,
        missingFields: ['idToken'],
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 400エラー + バリデーションエラー
      expect(response.status).toBe(400);
    });

    test('IDトークンフィールドなし', async () => {
      // Given: idTokenフィールドがないリクエスト
      mockValidateRequiredFields.mockReturnValue({
        isValid: false,
        missingFields: ['idToken'],
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 400エラー + 必須フィールドエラー
      expect(response.status).toBe(400);
    });

    test('不正なJSONフォーマット', async () => {
      // Given: 不正なJSONフォーマット
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 400エラー + JSONパースエラー
      expect(response.status).toBe(400);
    });
  });

  describe('エラーハンドリング', () => {
    test('Firestore接続エラー', async () => {
      // Given: 有効なID Token + Firestore接続エラー
      const validIdToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
        name: 'Test User',
      };

      mockValidateRequiredFields.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest
          .fn()
          .mockRejectedValue(new Error('Firestore connection failed')),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: validIdToken }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 500エラー + データベースエラーメッセージ
      expect(response.status).toBe(500);
    });

    test('ユーザードキュメント作成失敗', async () => {
      // Given: 新規ユーザー + Firestore書き込み失敗
      const validIdToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'newuser123',
        email: 'newuser@example.com',
        name: 'New User',
      };

      const mockUserDoc = {
        exists: false,
      };

      mockValidateRequiredFields.mockReturnValue({
        isValid: true,
        missingFields: [],
      });

      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockDoc = {
        get: jest.fn().mockResolvedValue(mockUserDoc),
        set: jest.fn().mockRejectedValue(new Error('Permission denied')),
      };

      mockFirestore().collection().doc.mockReturnValue(mockDoc);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: validIdToken }),
      });

      // When: ログインAPIを呼び出す
      const response = await POST(request);

      // Then: 500エラー + 適切なエラーハンドリング
      expect(response.status).toBe(500);
    });
  });
});
