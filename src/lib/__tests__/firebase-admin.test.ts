import { initializeFirebaseAdmin, verifyIdToken } from '../firebase-admin';

// Firebase Admin SDKのモック
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
}));

describe('Firebase Admin SDK', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('初期化', () => {
    test('正常に初期化される', () => {
      // Given: 正しい環境変数
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';

      // When: initializeFirebaseAdmin()を呼び出す
      expect(() => initializeFirebaseAdmin()).not.toThrow();

      // Then: アプリが正常に初期化される
      const { initializeApp } = require('firebase-admin/app');
      expect(initializeApp).toHaveBeenCalled();
    });

    test('環境変数不足時のエラー', () => {
      // Given: 不完全な環境変数
      delete process.env.FIREBASE_PROJECT_ID;

      // When & Then: initializeFirebaseAdmin()を呼び出すとエラー
      expect(() => initializeFirebaseAdmin()).toThrow(
        'Firebase環境変数が設定されていません'
      );
    });

    test('FIREBASE_CLIENT_EMAIL不足時のエラー', () => {
      // Given: FIREBASE_CLIENT_EMAIL不足
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
      delete process.env.FIREBASE_CLIENT_EMAIL;

      // When & Then: エラーがスローされる
      expect(() => initializeFirebaseAdmin()).toThrow(
        'Firebase環境変数が設定されていません'
      );
    });

    test('FIREBASE_PRIVATE_KEY不足時のエラー', () => {
      // Given: FIREBASE_PRIVATE_KEY不足
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      delete process.env.FIREBASE_PRIVATE_KEY;

      // When & Then: エラーがスローされる
      expect(() => initializeFirebaseAdmin()).toThrow(
        'Firebase環境変数が設定されていません'
      );
    });
  });

  describe('ID Token検証', () => {
    beforeEach(() => {
      // 環境変数をセットアップ
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
    });

    test('有効なID Tokenの検証成功', async () => {
      // Given: 有効なFirebase ID Token
      const validIdToken = 'valid-firebase-id-token';
      const mockDecodedToken = {
        uid: 'user123',
        email: 'user@example.com',
        name: 'Test User',
        iss: 'https://securetoken.google.com/test-project',
        aud: 'test-project',
        auth_time: Math.floor(Date.now() / 1000),
        user_id: 'user123',
        sub: 'user123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email_verified: true,
        firebase: {
          identities: { email: ['user@example.com'] },
          sign_in_provider: 'password',
        },
      };

      const { getAuth } = require('firebase-admin/auth');
      getAuth().verifyIdToken.mockResolvedValue(mockDecodedToken);

      // When: verifyIdToken()を呼び出す
      const decodedToken = await verifyIdToken(validIdToken);

      // Then: デコード成功
      expect(decodedToken).toEqual(mockDecodedToken);
      expect(decodedToken.uid).toBe('user123');
      expect(decodedToken.email).toBe('user@example.com');
    });

    test('無効なID Tokenの検証失敗', async () => {
      // Given: 無効なID Token
      const invalidIdToken = 'invalid-token';

      const { getAuth } = require('firebase-admin/auth');
      getAuth().verifyIdToken.mockRejectedValue(new Error('invalid-id-token'));

      // When & Then: verifyIdToken()を呼び出すとエラー
      await expect(verifyIdToken(invalidIdToken)).rejects.toThrow(
        'invalid-id-token'
      );
    });

    test('期限切れID Tokenの検証失敗', async () => {
      // Given: 期限切れのID Token
      const expiredIdToken = 'expired-token';

      const authError = new Error('Firebase ID token has expired');
      (authError as any).code = 'auth/id-token-expired';

      const { getAuth } = require('firebase-admin/auth');
      getAuth().verifyIdToken.mockRejectedValue(authError);

      // When & Then: auth/id-token-expiredエラー
      await expect(verifyIdToken(expiredIdToken)).rejects.toThrow(
        'Firebase ID token has expired'
      );
    });

    test('取り消されたID Tokenの検証失敗', async () => {
      // Given: 取り消されたID Token
      const revokedIdToken = 'revoked-token';

      const authError = new Error('Firebase ID token has been revoked');
      (authError as any).code = 'auth/id-token-revoked';

      const { getAuth } = require('firebase-admin/auth');
      getAuth().verifyIdToken.mockRejectedValue(authError);

      // When & Then: auth/id-token-revokedエラー
      await expect(verifyIdToken(revokedIdToken)).rejects.toThrow(
        'Firebase ID token has been revoked'
      );
    });
  });
});
