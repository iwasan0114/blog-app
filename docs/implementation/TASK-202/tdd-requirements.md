# TASK-202: ブログAPI実装 - TDD要件定義

## 概要

ブログ記事のCRUD操作を提供するREST APIエンドポイントを実装する。
Firebase Firestoreとの連携、JWT認証、バリデーション、エラーハンドリング、ページネーション、検索機能を含む。

## APIエンドポイント仕様

### 1. ブログ一覧取得・検索・ページネーション
**`GET /api/blogs`**

#### リクエストパラメータ
```typescript
interface BlogSearchQuery {
  status?: BlogStatus;           // 'draft' | 'published'
  keyword?: string;              // タイトル・コンテンツ検索
  authorId?: string;             // 作成者ID
  page?: number;                 // ページ番号（デフォルト: 1）
  limit?: number;                // 1ページあたりの件数（デフォルト: 10、最大: 50）
  sortBy?: 'createdAt' | 'updatedAt' | 'title';  // ソートフィールド（デフォルト: 'createdAt'）
  sortOrder?: 'asc' | 'desc';    // ソート順（デフォルト: 'desc'）
}
```

#### レスポンス
```typescript
interface BlogListResponse extends ApiResponse<PaginatedResponse<Blog>> {
  data: {
    items: Blog[];
    pagination: PaginationInfo;
  };
}
```

### 2. ブログ詳細取得
**`GET /api/blogs/[id]`**

#### リクエストパラメータ
- `id`: string - ブログ記事ID

#### レスポンス
```typescript
interface BlogDetailResponse extends ApiResponse<Blog> {
  data: Blog;
}
```

### 3. ブログ作成
**`POST /api/blogs`**

#### 認証要件
- 要JWT認証
- 管理者権限必須

#### リクエストボディ
```typescript
interface CreateBlogRequest {
  title: string;                 // 必須、1-200文字
  content: string;               // 必須、1-50000文字
  status: BlogStatus;            // 必須、'draft' | 'published'
  imageUrl?: string;             // 任意、有効なURL形式
}
```

#### レスポンス
```typescript
interface CreateBlogResponse extends ApiResponse<Blog> {
  data: Blog;
}
```

### 4. ブログ更新
**`PUT /api/blogs/[id]`**

#### 認証要件
- 要JWT認証
- 管理者権限必須

#### リクエストパラメータ
- `id`: string - ブログ記事ID

#### リクエストボディ
```typescript
interface UpdateBlogRequest {
  title?: string;                // 任意、1-200文字
  content?: string;              // 任意、1-50000文字
  status?: BlogStatus;           // 任意、'draft' | 'published'
  imageUrl?: string;             // 任意、有効なURL形式またはnull（削除時）
}
```

#### レスポンス
```typescript
interface UpdateBlogResponse extends ApiResponse<Blog> {
  data: Blog;
}
```

### 5. ブログ削除
**`DELETE /api/blogs/[id]`**

#### 認証要件
- 要JWT認証
- 管理者権限必須

#### リクエストパラメータ
- `id`: string - ブログ記事ID

#### レスポンス
```typescript
interface DeleteBlogResponse extends ApiResponse<{ id: string }> {
  data: { id: string };
}
```

## 機能要件

### 1. Firestoreクエリ実装

#### 1.1 データベース設計
- コレクション名: `blogs`
- ドキュメント構造: Blogエンティティと一致
- インデックス要件:
  - `status` フィールド
  - `createdAt` フィールド（降順）
  - `updatedAt` フィールド（降順）
  - `authorId` フィールド
  - 複合インデックス: `status` + `createdAt`

#### 1.2 クエリ最適化
- ページネーション: FirestoreのstartAfter/limitを使用
- 検索: タイトル・コンテンツでの部分一致検索
- フィルタリング: statusとauthorIdでの絞り込み
- ソート: 指定フィールドでの昇順・降順ソート

### 2. 認証チェック（JWT Token）

#### 2.1 認証フロー
1. Authorization ヘッダーからBearerトークン抽出
2. Firebase Admin SDKでトークン検証
3. ユーザー情報の取得とロール確認
4. 管理者権限の検証

#### 2.2 認証エラーハンドリング
- 401: トークンなし・無効・期限切れ
- 403: 権限不足（非管理者）
- 500: 認証サーバーエラー

### 3. バリデーション

#### 3.1 リクエストバリデーション
- **タイトル**: 必須、1-200文字、HTML タグ除去
- **コンテンツ**: 必須、1-50000文字
- **ステータス**: 必須、'draft' | 'published'のみ
- **画像URL**: 任意、有効なURL形式、HTTPS推奨
- **ページング**: page >= 1, limit 1-50

#### 3.2 サニタイゼーション
- HTMLタグの除去（title）
- XSS対策（content内のスクリプト除去）
- SQLインジェクション対策（Firestoreは自動対応）

### 4. エラーハンドリング

#### 4.1 エラーレスポンス形式
```typescript
interface ErrorResponse extends ApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

#### 4.2 エラーコード定義
- `VALIDATION_ERROR`: バリデーションエラー
- `UNAUTHORIZED`: 認証エラー
- `FORBIDDEN`: 権限エラー
- `NOT_FOUND`: リソースが見つからない
- `CONFLICT`: データ競合エラー
- `INTERNAL_ERROR`: 内部サーバーエラー

### 5. ページネーション

#### 5.1 ページネーション仕様
```typescript
interface PaginationInfo {
  page: number;          // 現在のページ番号
  limit: number;         // 1ページあたりの件数
  total: number;         // 総件数
  hasNext: boolean;      // 次ページ存在フラグ
  hasPrev: boolean;      // 前ページ存在フラグ
}
```

#### 5.2 実装要件
- デフォルトページサイズ: 10件
- 最大ページサイズ: 50件
- 総件数の効率的な計算
- カーソルベースページネーション（Firestore最適化）

### 6. 検索機能

#### 6.1 検索対象
- タイトル（部分一致、大文字小文字区別なし）
- コンテンツ（部分一致、大文字小文字区別なし）

#### 6.2 検索最適化
- 検索インデックスの活用
- 検索結果のハイライト機能
- 検索パフォーマンス: 500ms以内

## データモデル

### 1. Blog エンティティ

```typescript
interface Blog {
  id: string;                    // ドキュメントID
  title: string;                 // タイトル（1-200文字）
  content: string;               // コンテンツ（1-50000文字）
  status: BlogStatus;            // ステータス
  imageUrl?: string;             // 画像URL（任意）
  createdAt: Date;              // 作成日時
  updatedAt: Date;              // 更新日時
  authorId: string;             // 作成者ID
}
```

### 2. 状態管理

```typescript
type BlogStatus = 'draft' | 'published';
```

#### 2.1 ステータス遷移ルール
- `draft` → `published`: 公開可能
- `published` → `draft`: 非公開化可能
- 削除: どちらのステータスからも可能

#### 2.2 公開制御
- `draft`: 管理者のみ閲覧可能
- `published`: 一般ユーザーも閲覧可能

### 3. タイムスタンプ

#### 3.1 自動設定
- `createdAt`: 新規作成時に現在日時を設定
- `updatedAt`: 更新時に現在日時を設定

#### 3.2 タイムゾーン
- UTC形式で保存
- レスポンス時にISO 8601形式で返却

### 4. 作成者情報

#### 4.1 authorId設定
- JWT トークンから取得したuidを設定
- 作成後の変更不可
- 作成者の詳細情報は別途usersコレクションから取得

## 受入基準

### 1. 各APIの成功/失敗条件

#### 1.1 GET /api/blogs（一覧取得）

**成功条件:**
- [ ] 認証なしでpublishedブログ一覧を取得できる
- [ ] 管理者認証ありでdraftブログも含めて取得できる
- [ ] ページネーションが正しく動作する
- [ ] 検索キーワードでフィルタリングできる
- [ ] ステータスでフィルタリングできる
- [ ] ソート機能が正しく動作する

**失敗条件:**
- [ ] 無効なページ番号でエラーになる
- [ ] 無効なlimit値でエラーになる
- [ ] 無効なsortBy値でエラーになる

#### 1.2 GET /api/blogs/[id]（詳細取得）

**成功条件:**
- [ ] 存在するpublishedブログの詳細を取得できる
- [ ] 管理者は存在するdraftブログの詳細を取得できる

**失敗条件:**
- [ ] 存在しないIDで404エラーになる
- [ ] 一般ユーザーがdraftブログにアクセスして403エラーになる
- [ ] 無効なID形式で400エラーになる

#### 1.3 POST /api/blogs（作成）

**成功条件:**
- [ ] 管理者が有効なデータでブログを作成できる
- [ ] 作成したブログが正しくFirestoreに保存される
- [ ] createdAt、updatedAtが自動設定される
- [ ] authorIdがJWTのuidと一致する

**失敗条件:**
- [ ] 未認証ユーザーがアクセスして401エラーになる
- [ ] 非管理者ユーザーがアクセスして403エラーになる
- [ ] 必須フィールドなしで400エラーになる
- [ ] 文字数制限を超えて400エラーになる
- [ ] 無効なステータス値で400エラーになる

#### 1.4 PUT /api/blogs/[id]（更新）

**成功条件:**
- [ ] 管理者が存在するブログを更新できる
- [ ] 部分更新が正しく動作する
- [ ] updatedAtが自動更新される
- [ ] authorIdは変更されない

**失敗条件:**
- [ ] 未認証ユーザーがアクセスして401エラーになる
- [ ] 非管理者ユーザーがアクセスして403エラーになる
- [ ] 存在しないIDで404エラーになる
- [ ] 無効なデータで400エラーになる

#### 1.5 DELETE /api/blogs/[id]（削除）

**成功条件:**
- [ ] 管理者が存在するブログを削除できる
- [ ] Firestoreからデータが削除される

**失敗条件:**
- [ ] 未認証ユーザーがアクセスして401エラーになる
- [ ] 非管理者ユーザーがアクセスして403エラーになる
- [ ] 存在しないIDで404エラーになる

### 2. パフォーマンス要件

#### 2.1 レスポンス時間
- [ ] ブログ一覧取得（10件）: 500ms以内
- [ ] ブログ詳細取得: 200ms以内
- [ ] ブログ作成: 1000ms以内
- [ ] ブログ更新: 1000ms以内
- [ ] ブログ削除: 500ms以内

#### 2.2 スループット
- [ ] 同時リクエスト100件まで処理可能
- [ ] ページネーション使用時のパフォーマンス劣化なし

#### 2.3 Firestoreクエリ最適化
- [ ] 必要最小限のドキュメント読み取り
- [ ] インデックス使用の確認
- [ ] N+1問題の回避

### 3. セキュリティ要件

#### 3.1 認証・認可
- [ ] JWT トークンの適切な検証
- [ ] 管理者権限の厳密なチェック
- [ ] セッション管理の安全性

#### 3.2 入力検証
- [ ] 全入力値のバリデーション
- [ ] XSS攻撃の防止
- [ ] SQLインジェクション対策（Firestore）

#### 3.3 データ保護
- [ ] 機密情報の漏洩防止
- [ ] ログ出力時のデータマスキング
- [ ] HTTPS通信の強制

### 4. 運用要件

#### 4.1 エラーログ
- [ ] 適切なエラーログの出力
- [ ] ログレベルの設定
- [ ] 個人情報のマスキング

#### 4.2 監視・メトリクス
- [ ] API使用量の監視
- [ ] エラー率の監視
- [ ] レスポンス時間の監視

## テスト要件

### 1. 単体テスト

#### 1.1 APIルートハンドラー
- 各HTTP メソッドの正常系テスト
- バリデーションエラーのテスト
- 認証・認可エラーのテスト
- Firestoreエラーのテスト

#### 1.2 ユーティリティ関数
- バリデーション関数のテスト
- ページネーション計算のテスト
- 検索クエリ生成のテスト

#### 1.3 テストカバレッジ
- 行カバレッジ: 90%以上
- 分岐カバレッジ: 85%以上

### 2. 統合テスト

#### 2.1 API連携テスト
- Firebase Admin SDK との連携
- Firestore クエリの実行
- 認証フローの統合テスト

#### 2.2 エンドツーエンドテスト
- ブログCRUD操作の完全フロー
- ページネーション機能
- 検索機能

### 3. パフォーマンステスト

#### 3.1 負荷テスト
- 同時接続数100のテスト
- 大量データでのページネーション
- 検索機能の負荷テスト

#### 3.2 ストレステスト
- メモリ使用量の監視
- レスポンス時間の劣化テスト

## 実装ファイル構成

### 1. APIルート
```
src/app/api/blogs/
├── route.ts                    # GET, POST /api/blogs
├── [id]/
│   └── route.ts               # GET, PUT, DELETE /api/blogs/[id]
└── __tests__/
    ├── route.test.ts          # ブログ一覧・作成テスト
    └── [id]/
        └── route.test.ts      # ブログ詳細・更新・削除テスト
```

### 2. サービス層
```
src/lib/services/
├── blog-service.ts            # ブログビジネスロジック
├── __tests__/
│   └── blog-service.test.ts   # サービス層テスト
└── types/
    └── blog-service.types.ts  # サービス固有の型定義
```

### 3. Firestore連携
```
src/lib/firestore/
├── blog-repository.ts         # ブログ データアクセス層
├── queries/
│   ├── blog-queries.ts       # Firestoreクエリ定義
│   └── pagination.ts        # ページネーション共通処理
└── __tests__/
    ├── blog-repository.test.ts
    └── queries/
        ├── blog-queries.test.ts
        └── pagination.test.ts
```

### 4. バリデーション
```
src/lib/validation/
├── blog-validation.ts         # ブログ バリデーション
├── __tests__/
│   └── blog-validation.test.ts
└── schemas/
    └── blog-schemas.ts        # バリデーションスキーマ
```

### 5. テストユーティリティ
```
src/__tests__/
├── helpers/
│   ├── blog-test-helpers.ts   # ブログ テスト用ヘルパー
│   ├── firestore-mock.ts     # Firestore モック
│   └── auth-mock.ts          # 認証 モック
└── fixtures/
    └── blog-fixtures.ts       # テストデータ
```

## 関連ドキュメント

- TASK-101: Firebase Authentication 統合
- TASK-102: 認証ガード実装
- REQ-201: ブログ機能要件
- API設計ガイドライン
- セキュリティ設計書
- Firestore データモデル設計書