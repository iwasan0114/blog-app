# TASK-201: 認証API実装 - テストケース

## テスト対象

1. `POST /api/auth/login` - ログインAPI
2. `POST /api/auth/logout` - ログアウトAPI  
3. `GET /api/auth/me` - ユーザー情報取得API
4. `firebase-admin.ts` - Firebase Admin SDK ユーティリティ
5. `auth-utils.ts` - 認証ヘルパー関数

## 1. POST /api/auth/login のテストケース

### 1.1 正常系テスト

#### TC-LOGIN-001: 有効なID Tokenでのログイン成功
```typescript
describe('POST /api/auth/login - 正常系', () => {
  test('有効なID Tokenでログイン成功', async () => {
    // Given: 有効なFirebase ID Token
    const validIdToken = 'valid-firebase-id-token';
    const mockUser = {
      uid: 'user123',
      email: 'user@example.com',
      name: 'Test User'
    };
    
    // When: ログインAPIを呼び出す
    const response = await POST(new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: validIdToken })
    }));
    
    // Then: ログイン成功
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('user@example.com');
  });
  
  test('新規ユーザーの初回ログイン', async () => {
    // Given: 有効なID Token + Firestoreにユーザー情報なし
    // When: ログインAPIを呼び出す
    // Then: 新規ユーザー作成 + ログイン成功
  });
  
  test('既存ユーザーのログイン（lastLoginAt更新）', async () => {
    // Given: 既存ユーザーの有効なID Token
    // When: ログインAPIを呼び出す
    // Then: lastLoginAtが更新される
  });
});
```

### 1.2 異常系テスト

#### TC-LOGIN-002: 無効なID Tokenでのログイン失敗
```typescript
describe('POST /api/auth/login - 異常系', () => {
  test('無効なID Tokenでログイン失敗', async () => {
    // Given: 無効なID Token
    const invalidIdToken = 'invalid-token';
    
    // When: ログインAPIを呼び出す
    const response = await POST(new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: invalidIdToken })
    }));
    
    // Then: ログイン失敗
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('無効なトークン');
  });
  
  test('期限切れID Tokenでログイン失敗', async () => {
    // Given: 期限切れのID Token
    // When: ログインAPIを呼び出す
    // Then: 401エラー + 適切なエラーメッセージ
  });
  
  test('空のリクエストボディ', async () => {
    // Given: 空のリクエストボディ
    // When: ログインAPIを呼び出す
    // Then: 400エラー + バリデーションエラー
  });
  
  test('IDトークンフィールドなし', async () => {
    // Given: idTokenフィールドがないリクエスト
    // When: ログインAPIを呼び出す
    // Then: 400エラー + 必須フィールドエラー
  });
});
```

### 1.3 エラーハンドリングテスト

#### TC-LOGIN-003: Firebase/Firestore エラー
```typescript
describe('POST /api/auth/login - エラーハンドリング', () => {
  test('Firebase Auth サービスエラー', async () => {
    // Given: Firebase Auth サービスが利用不可
    // When: ログインAPIを呼び出す
    // Then: 500エラー + サービスエラーメッセージ
  });
  
  test('Firestore接続エラー', async () => {
    // Given: Firestoreが利用不可
    // When: ログインAPIを呼び出す
    // Then: 500エラー + データベースエラーメッセージ
  });
  
  test('ユーザードキュメント作成失敗', async () => {
    // Given: 新規ユーザー + Firestore書き込み権限なし
    // When: ログインAPIを呼び出す
    // Then: 500エラー + 適切なエラーハンドリング
  });
});
```

## 2. POST /api/auth/logout のテストケース

### 2.1 正常系テスト

#### TC-LOGOUT-001: 正常なログアウト
```typescript
describe('POST /api/auth/logout - 正常系', () => {
  test('セッショントークンありでログアウト成功', async () => {
    // Given: 有効なセッショントークン
    const sessionToken = 'valid-session-token';
    
    // When: ログアウトAPIを呼び出す
    const response = await POST(new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken })
    }));
    
    // Then: ログアウト成功
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('ログアウトしました');
  });
  
  test('セッショントークンなしでログアウト成功', async () => {
    // Given: セッショントークンなし
    // When: ログアウトAPIを呼び出す
    // Then: ログアウト成功（冪等性）
  });
});
```

### 2.2 異常系テスト

#### TC-LOGOUT-002: 無効なセッション
```typescript
describe('POST /api/auth/logout - 異常系', () => {
  test('無効なセッショントークン', async () => {
    // Given: 無効なセッショントークン
    // When: ログアウトAPIを呼び出す
    // Then: 400エラー + 無効なセッションエラー
  });
  
  test('期限切れセッショントークン', async () => {
    // Given: 期限切れのセッショントークン
    // When: ログアウトAPIを呼び出す
    // Then: 401エラー + セッション期限切れエラー
  });
});
```

## 3. GET /api/auth/me のテストケース

### 3.1 正常系テスト

#### TC-ME-001: 認証済みユーザー情報取得
```typescript
describe('GET /api/auth/me - 正常系', () => {
  test('有効なAuthorizationヘッダーでユーザー情報取得', async () => {
    // Given: 有効なFirebase ID Token in Authorization header
    const validIdToken = 'Bearer valid-firebase-id-token';
    
    // When: /api/auth/meを呼び出す
    const response = await GET(new Request('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': validIdToken }
    }));
    
    // Then: ユーザー情報取得成功
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('email');
    expect(data.user).toHaveProperty('role');
  });
  
  test('管理者ユーザーの情報取得', async () => {
    // Given: 管理者ユーザーのID Token
    // When: /api/auth/meを呼び出す
    // Then: roleが'admin'のユーザー情報取得
  });
  
  test('一般ユーザーの情報取得', async () => {
    // Given: 一般ユーザーのID Token
    // When: /api/auth/meを呼び出す
    // Then: roleが'user'のユーザー情報取得
  });
});
```

### 3.2 異常系テスト

#### TC-ME-002: 認証失敗
```typescript
describe('GET /api/auth/me - 異常系', () => {
  test('Authorizationヘッダーなし', async () => {
    // Given: Authorizationヘッダーなし
    // When: /api/auth/meを呼び出す
    // Then: 401エラー + 認証が必要エラー
  });
  
  test('無効なBearerトークン', async () => {
    // Given: 無効なBearerトークン
    const invalidToken = 'Bearer invalid-token';
    
    // When: /api/auth/meを呼び出す
    const response = await GET(new Request('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': invalidToken }
    }));
    
    // Then: 401エラー + 無効なトークンエラー
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
  
  test('期限切れトークン', async () => {
    // Given: 期限切れのID Token
    // When: /api/auth/meを呼び出す
    // Then: 401エラー + トークン期限切れエラー
  });
  
  test('Bearerプレフィックスなし', async () => {
    // Given: Bearerプレフィックスなしのトークン
    // When: /api/auth/meを呼び出す
    // Then: 400エラー + 不正なAuthorizationフォーマット
  });
});
```

## 4. Firebase Admin SDK のテストケース

### 4.1 初期化テスト

#### TC-ADMIN-001: Firebase Admin SDK 初期化
```typescript
describe('Firebase Admin SDK', () => {
  test('正常に初期化される', () => {
    // Given: 正しい環境変数
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
    
    // When: initializeFirebaseAdmin()を呼び出す
    const app = initializeFirebaseAdmin();
    
    // Then: アプリが正常に初期化される
    expect(app).toBeDefined();
    expect(app.name).toBe('[DEFAULT]');
  });
  
  test('環境変数不足時のエラー', () => {
    // Given: 不完全な環境変数
    delete process.env.FIREBASE_PROJECT_ID;
    
    // When: initializeFirebaseAdmin()を呼び出す
    // Then: エラーがスローされる
    expect(() => initializeFirebaseAdmin()).toThrow();
  });
  
  test('重複初期化の防止', () => {
    // Given: 既に初期化済みのFirebase Admin
    // When: 再度initializeFirebaseAdmin()を呼び出す
    // Then: 既存のインスタンスが返される（重複初期化なし）
  });
});
```

### 4.2 トークン検証テスト

#### TC-ADMIN-002: ID Token 検証
```typescript
describe('Firebase Admin SDK - Token Verification', () => {
  test('有効なID Tokenの検証成功', async () => {
    // Given: 有効なFirebase ID Token
    const validIdToken = 'valid-firebase-id-token';
    
    // When: verifyIdToken()を呼び出す
    const decodedToken = await verifyIdToken(validIdToken);
    
    // Then: デコード成功
    expect(decodedToken).toHaveProperty('uid');
    expect(decodedToken).toHaveProperty('email');
  });
  
  test('無効なID Tokenの検証失敗', async () => {
    // Given: 無効なID Token
    const invalidIdToken = 'invalid-token';
    
    // When: verifyIdToken()を呼び出す
    // Then: エラーがスローされる
    await expect(verifyIdToken(invalidIdToken)).rejects.toThrow();
  });
  
  test('期限切れID Tokenの検証失敗', async () => {
    // Given: 期限切れのID Token
    // When: verifyIdToken()を呼び出す
    // Then: auth/id-token-expiredエラー
  });
});
```

## 5. 認証ユーティリティのテストケース

### 5.1 ヘルパー関数テスト

#### TC-UTILS-001: 認証ユーティリティ関数
```typescript
describe('Auth Utils', () => {
  test('AuthorizationヘッダーからBearerトークン抽出', () => {
    // Given: 正しいAuthorizationヘッダー
    const authHeader = 'Bearer abc123token';
    
    // When: extractBearerToken()を呼び出す
    const token = extractBearerToken(authHeader);
    
    // Then: トークンが正しく抽出される
    expect(token).toBe('abc123token');
  });
  
  test('不正なAuthorizationヘッダー形式', () => {
    // Given: 不正な形式のヘッダー
    const invalidHeader = 'InvalidFormat abc123';
    
    // When: extractBearerToken()を呼び出す
    // Then: nullまたはエラーが返される
    expect(extractBearerToken(invalidHeader)).toBeNull();
  });
  
  test('APIエラーレスポンス生成', () => {
    // Given: エラー情報
    const error = new Error('Test error');
    const statusCode = 400;
    
    // When: createErrorResponse()を呼び出す
    const response = createErrorResponse(error, statusCode);
    
    // Then: 適切なエラーレスポンスが生成される
    expect(response.status).toBe(400);
  });
});
```

### 5.2 セッション管理テスト

#### TC-UTILS-002: セッション管理
```typescript
describe('Session Management', () => {
  test('セッショントークン生成', () => {
    // Given: ユーザー情報
    const user = { uid: 'user123', email: 'user@example.com' };
    
    // When: generateSessionToken()を呼び出す
    const token = generateSessionToken(user);
    
    // Then: セッショントークンが生成される
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });
  
  test('セッショントークン検証', () => {
    // Given: 有効なセッショントークン
    const validToken = 'valid-session-token';
    
    // When: validateSessionToken()を呼び出す
    const isValid = validateSessionToken(validToken);
    
    // Then: 検証結果が返される
    expect(isValid).toBe(true);
  });
  
  test('セッション無効化', () => {
    // Given: アクティブなセッション
    const sessionId = 'session123';
    
    // When: invalidateSession()を呼び出す
    const result = invalidateSession(sessionId);
    
    // Then: セッションが無効化される
    expect(result).toBe(true);
  });
});
```

## 6. 統合テストケース

### 6.1 エンドツーエンドフロー

#### TC-E2E-001: 完全な認証フロー
```typescript
describe('E2E - 認証フロー', () => {
  test('ログイン → ユーザー情報取得 → ログアウト', async () => {
    // 1. ログイン
    const loginResponse = await POST('/api/auth/login', {
      idToken: 'valid-firebase-id-token'
    });
    expect(loginResponse.status).toBe(200);
    
    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    
    // 2. ユーザー情報取得
    const meResponse = await GET('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    expect(meResponse.status).toBe(200);
    
    // 3. ログアウト
    const logoutResponse = await POST('/api/auth/logout', {
      sessionToken
    });
    expect(logoutResponse.status).toBe(200);
  });
});
```

## 7. パフォーマンステストケース

### 7.1 レスポンス時間テスト

#### TC-PERF-001: パフォーマンス要件
```typescript
describe('Performance Tests', () => {
  test('ログインAPIのレスポンス時間', async () => {
    // Given: 有効なID Token
    const startTime = Date.now();
    
    // When: ログインAPIを呼び出す
    await POST('/api/auth/login', { idToken: 'valid-token' });
    
    // Then: 500ms以内にレスポンス
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(500);
  });
  
  test('同時リクエスト処理', async () => {
    // Given: 複数の同時リクエスト
    const requests = Array(10).fill().map(() => 
      POST('/api/auth/login', { idToken: 'valid-token' })
    );
    
    // When: 同時実行
    const responses = await Promise.all(requests);
    
    // Then: 全て正常に処理される
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

## テスト実行環境

### 単体・統合テスト
- **フレームワーク**: Jest + Next.js API Testing
- **モック**: Firebase Admin SDK, Firestore
- **環境**: Node.js テスト環境

### E2Eテスト  
- **フレームワーク**: Playwright または Jest + Supertest
- **環境**: Development環境（実際のFirebase接続）

## テストデータ

### Firebase ID Token モック
```typescript
const mockIdTokens = {
  valid: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  expired: 'expired-token-example',
  invalid: 'invalid-token-example',
  adminUser: 'admin-user-token',
  regularUser: 'regular-user-token'
};
```

### ユーザーモックデータ
```typescript
const mockUsers = {
  admin: {
    uid: 'admin123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin'
  },
  user: {
    uid: 'user123', 
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user'
  }
};
```

## 期待される結果

### 成功ケース
- 全テストが通過する
- APIレスポンス時間が要件を満たす
- セキュリティテストで脆弱性が発見されない
- 実際のFirebaseとの統合が正常に動作する

### 失敗ケース（意図的な失敗テスト）
- 無効なトークンでAPI呼び出しが拒否される
- 権限不足でアクセスが拒否される
- 不正なリクエスト形式でバリデーションエラーが発生する