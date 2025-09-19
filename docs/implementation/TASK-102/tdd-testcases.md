# TASK-102: 認証ガード実装 - テストケース

## テスト対象

1. `useAuthGuard` フック
2. `AuthGuard` コンポーネント  
3. `ProtectedRoute` コンポーネント（更新版）

## 1. useAuthGuard フックのテストケース

### 1.1 基本機能テスト

#### TC-UH-001: 未認証ユーザー
```typescript
describe('useAuthGuard - 未認証ユーザー', () => {
  test('未認証時にisAuthenticatedがfalseを返す', () => {
    // Given: ユーザーが未認証
    // When: useAuthGuardを呼び出す
    // Then: 認証状態がfalse
  });
  
  test('redirectToLoginが正しく動作する', () => {
    // Given: ユーザーが未認証
    // When: redirectToLoginを呼び出す
    // Then: /loginにリダイレクトされる
  });
});
```

#### TC-UH-002: 認証済み一般ユーザー
```typescript
describe('useAuthGuard - 認証済み一般ユーザー', () => {
  test('認証済み一般ユーザーの処理', () => {
    // Given: 一般ユーザーが認証済み
    // When: useAuthGuardを呼び出す
    // Then: 認証状態がtrueだが管理者権限はfalse
  });
});
```

#### TC-UH-003: 認証済み管理者
```typescript
describe('useAuthGuard - 認証済み管理者', () => {
  test('管理者ユーザーの処理', () => {
    // Given: 管理者が認証済み
    // When: useAuthGuardを呼び出す
    // Then: 認証状態と管理者権限がtrue
  });
});
```

#### TC-UH-004: ローディング状態
```typescript
describe('useAuthGuard - ローディング状態', () => {
  test('認証確認中のローディング状態', () => {
    // Given: 認証状態確認中
    // When: useAuthGuardを呼び出す
    // Then: ローディング状態がtrue
  });
});
```

## 2. AuthGuard コンポーネントのテストケース

### 2.1 認証状態別テスト

#### TC-AG-001: ローディング状態
```typescript
describe('AuthGuard - ローディング状態', () => {
  test('デフォルトローディング表示', () => {
    // Given: 認証状態確認中
    // When: AuthGuardを描画
    // Then: デフォルトローディングUIが表示される
  });
  
  test('カスタムfallback表示', () => {
    // Given: 認証状態確認中 & カスタムfallback指定
    // When: AuthGuardを描画
    // Then: カスタムfallbackが表示される
  });
});
```

#### TC-AG-002: 未認証ユーザー
```typescript
describe('AuthGuard - 未認証ユーザー', () => {
  test('デフォルトリダイレクト(/login)', () => {
    // Given: ユーザーが未認証
    // When: AuthGuardを描画
    // Then: /loginにリダイレクトされる
  });
  
  test('カスタムリダイレクト先', () => {
    // Given: ユーザーが未認証 & redirectTo="/custom-login"
    // When: AuthGuardを描画
    // Then: /custom-loginにリダイレクトされる
  });
});
```

#### TC-AG-003: 認証済みユーザー（一般）
```typescript
describe('AuthGuard - 認証済み一般ユーザー', () => {
  test('管理者権限不要時のアクセス許可', () => {
    // Given: 一般ユーザーが認証済み & requireAdmin=false
    // When: AuthGuardを描画
    // Then: childrenが表示される
  });
  
  test('管理者権限必要時のアクセス拒否', () => {
    // Given: 一般ユーザーが認証済み & requireAdmin=true
    // When: AuthGuardを描画
    // Then: 権限不足エラーメッセージが表示される
  });
});
```

#### TC-AG-004: 認証済みユーザー（管理者）
```typescript
describe('AuthGuard - 認証済み管理者', () => {
  test('管理者権限不要時のアクセス許可', () => {
    // Given: 管理者が認証済み & requireAdmin=false
    // When: AuthGuardを描画
    // Then: childrenが表示される
  });
  
  test('管理者権限必要時のアクセス許可', () => {
    // Given: 管理者が認証済み & requireAdmin=true
    // When: AuthGuardを描画
    // Then: childrenが表示される
  });
});
```

### 2.2 権限不足エラー表示テスト

#### TC-AG-005: 権限不足UI
```typescript
describe('AuthGuard - 権限不足UI', () => {
  test('権限不足エラーメッセージの表示', () => {
    // Given: 一般ユーザー & requireAdmin=true
    // When: AuthGuardを描画
    // Then: 適切なエラーメッセージが表示される
  });
  
  test('エラーメッセージの内容確認', () => {
    // Given: 権限不足状態
    // When: エラーメッセージを確認
    // Then: "アクセス権限がありません"等の文言が含まれる
  });
});
```

## 3. ProtectedRoute コンポーネントのテストケース

### 3.1 レガシー互換性テスト

#### TC-PR-001: 基本機能
```typescript
describe('ProtectedRoute - レガシー互換', () => {
  test('AuthGuardのラッパーとして機能', () => {
    // Given: ProtectedRouteコンポーネント
    // When: 描画する
    // Then: AuthGuardコンポーネントが呼び出される
  });
  
  test('propsの正しい受け渡し', () => {
    // Given: ProtectedRouteにpropsを渡す
    // When: 描画する
    // Then: AuthGuardに正しくpropsが渡される
  });
});
```

## 4. 統合テストケース

### 4.1 認証フローとの連携

#### TC-INT-001: ログイン後のアクセス
```typescript
describe('統合テスト - 認証フロー連携', () => {
  test('ログイン後に保護されたページにアクセス可能', () => {
    // Given: 未認証ユーザー
    // When: ログイン後にProtectedRouteでラップされたページにアクセス
    // Then: ページが正常に表示される
  });
  
  test('ログアウト後にページから追い出される', () => {
    // Given: 認証済みユーザーが保護されたページを閲覧中
    // When: ログアウトする
    // Then: ログインページにリダイレクトされる
  });
});
```

### 4.2 リダイレクト処理

#### TC-INT-002: リダイレクト動作
```typescript
describe('統合テスト - リダイレクト処理', () => {
  test('未認証時のリダイレクト', () => {
    // Given: 未認証ユーザー
    // When: 保護されたページにアクセス
    // Then: ログインページにリダイレクトされる
  });
  
  test('権限不足時の処理', () => {
    // Given: 一般ユーザー
    // When: 管理者限定ページにアクセス
    // Then: 権限不足エラーが表示される（リダイレクトなし）
  });
});
```

## 5. エラーハンドリングテストケース

### 5.1 認証状態エラー

#### TC-ERR-001: 認証コンテキストエラー
```typescript
describe('エラーハンドリング - 認証コンテキスト', () => {
  test('AuthContextが未提供時のエラー', () => {
    // Given: AuthProviderで囲まれていないコンポーネント
    // When: useAuthGuardを使用
    // Then: 適切なエラーメッセージが表示される
  });
});
```

### 5.2 ネットワークエラー

#### TC-ERR-002: ネットワーク障害
```typescript
describe('エラーハンドリング - ネットワーク', () => {
  test('認証状態取得失敗時の処理', () => {
    // Given: ネットワークエラーで認証状態が取得できない
    // When: AuthGuardを使用
    // Then: 適切なエラー処理が行われる
  });
});
```

## 6. パフォーマンステストケース

### 6.1 レンダリング性能

#### TC-PERF-001: レンダリング最適化
```typescript
describe('パフォーマンステスト', () => {
  test('不要な再レンダリングが発生しない', () => {
    // Given: 認証状態が変化しない
    // When: 親コンポーネントが再レンダリング
    // Then: AuthGuardは再レンダリングされない
  });
  
  test('認証状態変化時のみ再レンダリング', () => {
    // Given: AuthGuardがマウント済み
    // When: 認証状態が変化
    // Then: 必要な再レンダリングのみ発生
  });
});
```

## 7. アクセシビリティテストケース

### 7.1 ARIA属性

#### TC-A11Y-001: アクセシビリティ対応
```typescript
describe('アクセシビリティ', () => {
  test('ローディング状態のARIA属性', () => {
    // Given: ローディング状態
    // When: スクリーンリーダーでアクセス
    // Then: 適切なaria-labelが設定されている
  });
  
  test('エラーメッセージのARIA属性', () => {
    // Given: 権限不足エラー
    // When: スクリーンリーダーでアクセス
    // Then: 適切なrole属性が設定されている
  });
});
```

## 8. E2Eテストケース（Playwright/Cypress）

### 8.1 ユーザージャーニー

#### TC-E2E-001: 未認証ユーザーのジャーニー
```typescript
describe('E2E - 未認証ユーザー', () => {
  test('保護されたページアクセス → ログイン → 元ページ表示', () => {
    // 1. 未認証で/dashboardにアクセス
    // 2. /loginにリダイレクト
    // 3. ログイン実行
    // 4. /dashboardに戻る
  });
});
```

#### TC-E2E-002: 権限管理ジャーニー
```typescript
describe('E2E - 権限管理', () => {
  test('一般ユーザーの管理者ページアクセス制限', () => {
    // 1. 一般ユーザーでログイン
    // 2. 管理者限定ページにアクセス
    // 3. 権限不足エラー表示
    // 4. ダッシュボードに戻る
  });
});
```

## テスト実行環境

### 単体・統合テスト
- **フレームワーク**: Jest + React Testing Library
- **モック**: Firebase Auth, Next.js Router
- **カバレッジ**: 90%以上

### E2Eテスト  
- **フレームワーク**: Playwright
- **ブラウザ**: Chrome, Firefox, Safari
- **環境**: Development環境

## テストデータ

### ユーザーモックデータ
```typescript
// 未認証ユーザー
const unauthenticatedUser = null;

// 一般ユーザー
const generalUser = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: new Date(),
  lastLoginAt: new Date(),
};

// 管理者ユーザー
const adminUser = {
  id: 'admin-123', 
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'admin',
  createdAt: new Date(),
  lastLoginAt: new Date(),
};
```

## 期待される結果

### 成功ケース
- 全テストが通過する
- コードカバレッジが90%以上
- パフォーマンステストで遅延がない
- E2Eテストで実際のユーザー操作が再現される

### 失敗ケース（意図的な失敗テスト）
- 認証が必要なページで未認証ユーザーがアクセス拒否される
- 管理者権限が必要なページで一般ユーザーがアクセス拒否される
- 不正な認証情報でアクセス拒否される