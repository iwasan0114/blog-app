# TASK-201: 認証API実装 - 要件定義

## 概要

サーバーサイドで実行される認証APIエンドポイントを実装する。
Firebase Admin SDKを使用したJWTトークン検証、ユーザー情報取得、セッション管理を含む。

## 機能要件

### 1. POST /api/auth/login

#### 1.1 目的
フロントエンドから送信されたFirebase ID Tokenを検証し、セッション管理を行う

#### 1.2 リクエスト仕様
```typescript
interface LoginRequest {
  idToken: string;  // Firebase ID Token
}
```

#### 1.3 レスポンス仕様
```typescript
interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    createdAt: string;
    lastLoginAt: string;
  };
  sessionToken?: string;  // オプション: 独自セッショントークン
}
```

#### 1.4 処理フロー
1. Firebase ID Tokenの検証
2. Firestoreからユーザー詳細情報の取得
3. lastLoginAtの更新
4. セッション情報の生成（オプション）
5. レスポンス返却

### 2. POST /api/auth/logout

#### 2.1 目的
ユーザーのセッションを無効化し、ログアウト処理を行う

#### 2.2 リクエスト仕様
```typescript
interface LogoutRequest {
  sessionToken?: string;  // オプション: セッショントークン
}
```

#### 2.3 レスポンス仕様
```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

#### 2.4 処理フロー
1. セッショントークンの検証（ある場合）
2. セッションの無効化
3. ログアウト完了レスポンス

### 3. GET /api/auth/me

#### 3.1 目的
現在のユーザー情報を取得する（認証状態確認）

#### 3.2 認証
Authorization ヘッダーでBearer トークンを送信

#### 3.3 レスポンス仕様
```typescript
interface MeResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    createdAt: string;
    lastLoginAt: string;
  } | null;
}
```

#### 3.4 処理フロー
1. Authorization ヘッダーからトークン取得
2. Firebase ID Tokenの検証
3. Firestoreからユーザー情報取得
4. ユーザー情報返却

## 技術要件

### 1. Firebase Admin SDK 統合

#### 1.1 初期化
```typescript
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 環境変数から設定を読み込み
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
```

#### 1.2 トークン検証
```typescript
const decodedToken = await getAuth().verifyIdToken(idToken);
```

### 2. エラーハンドリング

#### 2.1 Firebase Auth エラー
- `auth/id-token-expired`: トークン期限切れ
- `auth/id-token-revoked`: トークン無効化済み
- `auth/invalid-id-token`: 無効なトークン
- `auth/user-not-found`: ユーザー不存在

#### 2.2 HTTP ステータスコード
- `200`: 成功
- `400`: 不正なリクエスト
- `401`: 認証失敗
- `403`: 権限不足
- `404`: リソース未発見
- `500`: サーバーエラー

### 3. セキュリティ要件

#### 3.1 CORS設定
- 適切なOriginの制限
- 必要なヘッダーのみ許可

#### 3.2 レート制限
- 認証エンドポイントの過度なリクエスト防止
- IP単位での制限

#### 3.3 ログ記録
- 認証試行の記録
- 不正アクセスの監視

## データ仕様

### 1. Firestore Users Collection
```typescript
interface UserDocument {
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isActive: boolean;
}
```

### 2. Environment Variables
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## パフォーマンス要件

### 1. レスポンス時間
- ログイン: 500ms以内
- ログアウト: 200ms以内
- ユーザー情報取得: 300ms以内

### 2. 同時接続
- 100同時ユーザーまで対応
- 適切なリソース管理

### 3. キャッシュ戦略
- ユーザー情報の適切なキャッシュ
- トークン検証結果のキャッシュ（短期間）

## テスト要件

### 1. 単体テスト
- 各エンドポイントの正常系・異常系
- Firebase Admin SDK のモック
- エラーハンドリングのテスト

### 2. 統合テスト
- 実際のFirebaseプロジェクトとの連携
- エンドツーエンドの認証フロー
- セッション管理のテスト

### 3. セキュリティテスト
- 無効なトークンでのアクセス
- 権限昇格の試行
- CSRF攻撃の防止

## 受け入れ基準

### 1. 機能面
- [ ] 有効なID Tokenでログインできる
- [ ] 無効なID Tokenではログインできない
- [ ] ログアウト処理が正常に動作する
- [ ] /api/auth/meで現在のユーザー情報を取得できる
- [ ] 未認証時に適切なエラーが返される

### 2. セキュリティ面
- [ ] トークンの偽造・改ざんを検出する
- [ ] 期限切れトークンを拒否する
- [ ] 適切なCORS設定がされている
- [ ] セッション管理が安全に行われる

### 3. パフォーマンス面
- [ ] レスポンス時間が要件を満たす
- [ ] メモリリークがない
- [ ] 適切なエラーハンドリングでサーバーが安定している

### 4. 運用面
- [ ] 適切なログが出力される
- [ ] 監視しやすいメトリクスが取得できる
- [ ] エラー通知が設定できる

## 実装ファイル

### 作成するファイル
1. `src/lib/firebase-admin.ts` - Firebase Admin SDK初期化
2. `src/app/api/auth/login/route.ts` - ログインAPI
3. `src/app/api/auth/logout/route.ts` - ログアウトAPI
4. `src/app/api/auth/me/route.ts` - ユーザー情報取得API
5. `src/lib/auth-utils.ts` - 認証ユーティリティ関数

### テストファイル
1. `src/app/api/auth/__tests__/login.test.ts`
2. `src/app/api/auth/__tests__/logout.test.ts`
3. `src/app/api/auth/__tests__/me.test.ts`
4. `src/lib/__tests__/firebase-admin.test.ts`
5. `src/lib/__tests__/auth-utils.test.ts`

### 設定ファイル
1. `.env.local.example` - 環境変数テンプレート
2. `next.config.js` 更新 - API設定

## セキュリティ考慮事項

### 1. トークン検証
- Firebase ID Tokenの署名検証
- トークンの有効期限チェック
- 発行者（issuer）の検証

### 2. セッション管理
- セッショントークンの安全な生成
- 適切な有効期限設定
- セッション無効化の実装

### 3. データ保護
- 機密情報のログ出力禁止
- 適切なHTTPヘッダー設定
- HTTPS強制の確認

## 運用考慮事項

### 1. 監視
- API呼び出し回数の監視
- エラー率の監視
- レスポンス時間の監視

### 2. ログ
- 認証成功・失敗のログ
- 不正アクセス試行のログ
- パフォーマンス情報のログ

### 3. アラート
- 異常な認証試行の検出
- サーバーエラーの通知
- レスポンス時間悪化の通知

## 関連ドキュメント
- TASK-101: Firebase Authentication 統合
- TASK-102: 認証ガード実装
- Firebase Admin SDK ドキュメント
- Next.js API Routes ドキュメント