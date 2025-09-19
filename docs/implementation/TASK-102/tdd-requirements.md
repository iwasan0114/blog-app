# TASK-102: 認証ガード実装 - 要件定義

## 概要

認証済みユーザーのみがアクセス可能なルート保護機能を実装する。
管理者権限チェック機能、未認証時のリダイレクト処理を含む。

## 機能要件

### 1. 認証ガードコンポーネント (AuthGuard)

#### 1.1 基本機能
- 認証状態のチェック
- 未認証時の自動リダイレクト
- 管理者権限の確認
- ローディング状態の表示

#### 1.2 Props Interface
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;        // 管理者権限が必要か
  fallback?: React.ReactNode;    // ローディング中の表示
  redirectTo?: string;           // リダイレクト先（デフォルト: /login）
}
```

#### 1.3 動作仕様
1. **認証状態確認中**: fallbackまたはデフォルトローディングを表示
2. **未認証**: redirectToで指定されたページにリダイレクト
3. **認証済み + 管理者権限不要**: childrenを表示
4. **認証済み + 管理者権限必要 + 管理者**: childrenを表示
5. **認証済み + 管理者権限必要 + 非管理者**: 権限不足エラーを表示

### 2. 認証フック (useAuthGuard)

#### 2.1 機能
- 認証状態の提供
- 管理者権限チェック
- リダイレクト処理のヘルパー

#### 2.2 戻り値Interface
```typescript
interface UseAuthGuardResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  redirectToLogin: () => void;
}
```

### 3. ProtectedRoute コンポーネント (レガシー互換)

#### 3.1 目的
- 既存コードとの互換性維持
- AuthGuardのシンプルなラッパー

#### 3.2 実装
```typescript
interface ProtectedRouteProps extends Omit<AuthGuardProps, 'children'> {
  children: React.ReactNode;
}
```

## 技術要件

### 1. 依存関係
- 既存のAuthContext (`useAuth`)
- Next.js Router (`useRouter`)
- React Hooks

### 2. パフォーマンス要件
- 認証状態チェック: 50ms以内
- リダイレクト処理: 100ms以内
- UI更新の遅延なし

### 3. セキュリティ要件
- 認証状態の偽装防止
- 権限昇格攻撃の防止
- セッション切れ時の適切な処理

## UI/UX要件

### 1. ローディング状態
- スピナーとメッセージを表示
- 最小表示時間: 200ms（フラッシュ防止）
- アクセシビリティ対応（aria-label）

### 2. エラー表示
- 権限不足時の分かりやすいメッセージ
- 管理者への連絡手段の提示
- ホームページへの戻るリンク

### 3. リダイレクト処理
- スムーズな画面遷移
- 元のページURLの保持（ログイン後に戻れるように）
- ブラウザの戻るボタン対応

## テスト要件

### 1. 単体テスト
- AuthGuardコンポーネントの各状態テスト
- useAuthGuardフックのテスト
- Edge caseのテスト

### 2. 統合テスト
- 認証フローとの連携テスト
- リダイレクト処理のテスト
- 権限チェックのテスト

### 3. E2Eテスト
- 未認証ユーザーのアクセステスト
- 認証済み一般ユーザーのテスト
- 管理者ユーザーのテスト

## エラーハンドリング

### 1. 認証エラー
- セッション切れ時の自動ログアウト
- 不正なトークンの検出と処理

### 2. 権限エラー
- 権限不足時の適切なメッセージ表示
- ユーザーフレンドリーなエラー画面

### 3. ネットワークエラー
- 認証状態確認失敗時の処理
- リトライ機能の実装

## 受け入れ基準

### 1. 機能面
- [ ] 未認証ユーザーは保護されたページにアクセスできない
- [ ] 認証済みユーザーは保護されたページにアクセスできる
- [ ] 管理者権限が必要なページで一般ユーザーはアクセスできない
- [ ] 管理者は全てのページにアクセスできる
- [ ] ローディング状態が適切に表示される

### 2. パフォーマンス面
- [ ] 認証チェックに遅延がない
- [ ] リダイレクト処理がスムーズ
- [ ] メモリリークがない

### 3. セキュリティ面
- [ ] 認証状態の偽装ができない
- [ ] 権限昇格攻撃が防げる
- [ ] セッション管理が適切

### 4. ユーザビリティ面
- [ ] エラーメッセージが分かりやすい
- [ ] ローディング状態が適切に表示される
- [ ] アクセシビリティ要件を満たす

## 実装ファイル

### 作成するファイル
1. `src/hooks/useAuthGuard.ts` - 認証ガードフック
2. `src/components/auth/AuthGuard.tsx` - 認証ガードコンポーネント
3. `src/components/auth/ProtectedRoute.tsx` - レガシー互換コンポーネント（更新）

### テストファイル
1. `src/hooks/__tests__/useAuthGuard.test.ts`
2. `src/components/auth/__tests__/AuthGuard.test.tsx`
3. `src/components/auth/__tests__/ProtectedRoute.test.tsx`

## 関連ドキュメント
- TASK-101: Firebase Authentication 統合
- REQ-102: 認証ガード要件
- セキュリティ設計書