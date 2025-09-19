# TASK-102: 認証ガード実装 - Red段階（テスト実装）

## 実装内容

失敗するテストを実装しました。これらのテストは現在失敗する状態であり、次のGreen段階で実装される機能によって成功するように設計されています。

## 作成されたテストファイル

### 1. useAuthGuard フックのテスト
**ファイル**: `src/hooks/__tests__/useAuthGuard.test.ts`

#### テスト対象機能
- 未認証ユーザーの状態管理
- 認証済み一般ユーザーの処理
- 認証済み管理者の処理  
- ローディング状態の管理
- リダイレクト機能

#### 主要テストケース
```typescript
describe('useAuthGuard', () => {
  // 未認証ユーザー
  test('未認証時にisAuthenticatedがfalseを返す')
  test('redirectToLoginが正しく動作する')
  
  // 認証済み一般ユーザー
  test('認証済み一般ユーザーの処理')
  
  // 認証済み管理者
  test('管理者ユーザーの処理')
  
  // ローディング状態
  test('認証確認中のローディング状態')
});
```

### 2. AuthGuard コンポーネントのテスト
**ファイル**: `src/components/auth/__tests__/AuthGuard.test.tsx`

#### テスト対象機能
- ローディング状態の表示
- 未認証ユーザーの処理
- 認証済みユーザーのアクセス制御
- 権限チェック機能
- カスタマイズ可能なUI

#### 主要テストケース
```typescript
describe('AuthGuard', () => {
  // ローディング状態
  test('デフォルトローディング表示')
  test('カスタムfallback表示')
  
  // 未認証ユーザー
  test('未認証時は子コンポーネントを表示しない')
  
  // 認証済みユーザー（一般）
  test('管理者権限不要時のアクセス許可')
  test('管理者権限必要時のアクセス拒否')
  
  // 認証済みユーザー（管理者）
  test('管理者権限不要時のアクセス許可')
  test('管理者権限必要時のアクセス許可')
  
  // 権限不足エラー
  test('権限不足エラーメッセージの詳細確認')
});
```

### 3. ProtectedRoute コンポーネントのテスト
**ファイル**: `src/components/auth/__tests__/ProtectedRoute.test.tsx`

#### テスト対象機能
- AuthGuardのラッパー機能
- propsの正しい受け渡し
- レガシー互換性の維持

#### 主要テストケース
```typescript
describe('ProtectedRoute', () => {
  // レガシー互換性
  test('AuthGuardのラッパーとして機能')
  test('propsの正しい受け渡し - requireAdmin')
  test('propsの正しい受け渡し - redirectTo')
  test('propsの正しい受け渡し - fallback')
  test('すべてのpropsの組み合わせ')
  
  // 非推奨機能
  test('ProtectedRouteが正常に動作する')
});
```

## テスト失敗の確認

現在、実装されるべきファイルが存在しないため、すべてのテストが失敗します：

### 期待される失敗
1. **useAuthGuard フック**: `src/hooks/useAuthGuard.ts` が存在しない
2. **AuthGuard コンポーネント**: `src/components/auth/AuthGuard.tsx` が存在しない  
3. **ProtectedRoute コンポーネント**: 既存の実装が新しいAuthGuardを使用していない

## モック設定

### 依存関係のモック
- **Next.js Router**: `useRouter`をモック化
- **AuthContext**: `useAuth`をモック化
- **AuthGuard**: ProtectedRouteテスト用にモック化

### テストデータ
```typescript
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
  name: 'Admin User', 
  role: 'admin',
  createdAt: new Date(),
  lastLoginAt: new Date(),
};
```

## 次のステップ

Green段階では、以下のファイルを実装してテストを成功させます：

1. `src/hooks/useAuthGuard.ts` - 認証ガードフック
2. `src/components/auth/AuthGuard.tsx` - 認証ガードコンポーネント
3. `src/components/auth/ProtectedRoute.tsx` - レガシー互換コンポーネント（更新）

## 実行確認

テストフレームワークの設定が完了していれば、以下のコマンドでテストの失敗を確認できます：

```bash
npm test -- --testPathPattern=useAuthGuard
npm test -- --testPathPattern=AuthGuard  
npm test -- --testPathPattern=ProtectedRoute
```

現在は実装ファイルが存在しないため、すべてのテストが失敗することが期待されます。