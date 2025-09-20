import {
  extractBearerToken,
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from '../auth-utils';

describe('Auth Utils', () => {
  describe('extractBearerToken', () => {
    test('AuthorizationヘッダーからBearerトークン抽出', () => {
      // Given: 正しいAuthorizationヘッダー
      const authHeader = 'Bearer abc123token';

      // When: extractBearerToken()を呼び出す
      const token = extractBearerToken(authHeader);

      // Then: トークンが正しく抽出される
      expect(token).toBe('abc123token');
    });

    test('Bearerプレフィックスなしの場合', () => {
      // Given: Bearerプレフィックスなしのヘッダー
      const invalidHeader = 'abc123token';

      // When: extractBearerToken()を呼び出す
      // Then: nullが返される
      expect(extractBearerToken(invalidHeader)).toBeNull();
    });

    test('不正なAuthorizationヘッダー形式', () => {
      // Given: 不正な形式のヘッダー
      const invalidHeader = 'InvalidFormat abc123';

      // When: extractBearerToken()を呼び出す
      // Then: nullが返される
      expect(extractBearerToken(invalidHeader)).toBeNull();
    });

    test('空のAuthorizationヘッダー', () => {
      // Given: 空のヘッダー
      const emptyHeader = '';

      // When: extractBearerToken()を呼び出す
      // Then: nullが返される
      expect(extractBearerToken(emptyHeader)).toBeNull();
    });

    test('Bearerのみでトークンなし', () => {
      // Given: Bearerのみのヘッダー
      const bearerOnlyHeader = 'Bearer';

      // When: extractBearerToken()を呼び出す
      // Then: nullが返される
      expect(extractBearerToken(bearerOnlyHeader)).toBeNull();
    });

    test('Bearerと空白のみ', () => {
      // Given: Bearerと空白のみのヘッダー
      const bearerWithSpaceHeader = 'Bearer ';

      // When: extractBearerToken()を呼び出す
      // Then: nullが返される
      expect(extractBearerToken(bearerWithSpaceHeader)).toBeNull();
    });
  });

  describe('createErrorResponse', () => {
    test('Errorオブジェクトからエラーレスポンス生成', () => {
      // Given: Errorオブジェクトとステータスコード
      const error = new Error('Test error message');
      const statusCode = 400;

      // When: createErrorResponse()を呼び出す
      const response = createErrorResponse(error, statusCode);

      // Then: 適切なエラーレスポンスが生成される
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    test('文字列エラーメッセージからレスポンス生成', () => {
      // Given: 文字列エラーメッセージ
      const errorMessage = 'Custom error message';
      const statusCode = 401;

      // When: createErrorResponse()を呼び出す
      const response = createErrorResponse(errorMessage, statusCode);

      // Then: 適切なエラーレスポンスが生成される
      expect(response.status).toBe(401);
    });

    test('デフォルトステータスコード500', () => {
      // Given: エラーメッセージのみ
      const error = new Error('Server error');

      // When: ステータスコード省略でcreateErrorResponse()を呼び出す
      const response = createErrorResponse(error);

      // Then: デフォルトで500が設定される
      expect(response.status).toBe(500);
    });

    test('Firebase Authエラーコードの処理', () => {
      // Given: Firebase Authエラー
      const firebaseError = new Error('Firebase ID token has expired');
      (firebaseError as any).code = 'auth/id-token-expired';

      // When: createErrorResponse()を呼び出す
      const response = createErrorResponse(firebaseError, 401);

      // Then: Firebase エラーが適切に処理される
      expect(response.status).toBe(401);
    });
  });

  describe('createSuccessResponse', () => {
    test('成功レスポンス生成', () => {
      // Given: レスポンスデータ
      const data = { success: true, message: 'Success' };

      // When: createSuccessResponse()を呼び出す
      const response = createSuccessResponse(data);

      // Then: 200ステータスの成功レスポンスが生成される
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    test('カスタムステータスコードでの成功レスポンス', () => {
      // Given: レスポンスデータとカスタムステータス
      const data = { success: true, created: true };
      const statusCode = 201;

      // When: createSuccessResponse()を呼び出す
      const response = createSuccessResponse(data, statusCode);

      // Then: 指定したステータスコードでレスポンスが生成される
      expect(response.status).toBe(201);
    });
  });

  describe('validateRequiredFields', () => {
    test('必須フィールドの検証成功', () => {
      // Given: 必要なフィールドがすべて含まれたデータ
      const data = {
        idToken: 'valid-token',
        email: 'user@example.com',
      };
      const requiredFields = ['idToken', 'email'];

      // When: validateRequiredFields()を呼び出す
      const result = validateRequiredFields(data, requiredFields);

      // Then: 検証成功
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    test('必須フィールド不足の検証失敗', () => {
      // Given: 必須フィールドが不足したデータ
      const data = {
        email: 'user@example.com',
        // idTokenが不足
      };
      const requiredFields = ['idToken', 'email'];

      // When: validateRequiredFields()を呼び出す
      const result = validateRequiredFields(data, requiredFields);

      // Then: 検証失敗
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['idToken']);
    });

    test('複数の必須フィールド不足', () => {
      // Given: 複数の必須フィールドが不足
      const data = {};
      const requiredFields = ['idToken', 'email', 'name'];

      // When: validateRequiredFields()を呼び出す
      const result = validateRequiredFields(data, requiredFields);

      // Then: すべての不足フィールドが報告される
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['idToken', 'email', 'name']);
    });

    test('空文字列は無効なフィールドとして扱う', () => {
      // Given: 空文字列のフィールド
      const data = {
        idToken: '',
        email: 'user@example.com',
      };
      const requiredFields = ['idToken', 'email'];

      // When: validateRequiredFields()を呼び出す
      const result = validateRequiredFields(data, requiredFields);

      // Then: 空文字列は無効として扱われる
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['idToken']);
    });

    test('null値は無効なフィールドとして扱う', () => {
      // Given: null値のフィールド
      const data = {
        idToken: null,
        email: 'user@example.com',
      };
      const requiredFields = ['idToken', 'email'];

      // When: validateRequiredFields()を呼び出す
      const result = validateRequiredFields(data, requiredFields);

      // Then: null値は無効として扱われる
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['idToken']);
    });

    test('undefined値は無効なフィールドとして扱う', () => {
      // Given: undefined値のフィールド
      const data = {
        idToken: undefined,
        email: 'user@example.com',
      };
      const requiredFields = ['idToken', 'email'];

      // When: validateRequiredFields()を呼び出す
      const result = validateRequiredFields(data, requiredFields);

      // Then: undefined値は無効として扱われる
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['idToken']);
    });
  });
});
