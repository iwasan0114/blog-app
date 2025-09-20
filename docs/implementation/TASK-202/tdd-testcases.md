# TASK-202: ブログAPI実装 - TDDテストケース仕様書

## 概要

ブログAPIの5つのエンドポイントに対する包括的なテストケース仕様です。

## テスト戦略

### 1. テスト構造
- **単体テスト**: 各APIエンドポイントの個別機能
- **統合テスト**: 認証・データベース統合
- **エッジケース**: 境界値・エラーシナリオ

### 2. モック戦略
- Firebase Admin SDK
- Firestore データベース
- 認証トークン検証

## API エンドポイント別テストケース

### GET /api/blogs (ブログ一覧取得)

#### 正常系テストケース

**TC-001: 認証済みユーザーによる基本一覧取得**
- **Given**: 有効なJWTトークンを持つユーザー
- **When**: GET /api/blogs を呼び出す
- **Then**: 
  - ステータス: 200
  - レスポンス: ブログ一覧と総数
  - デフォルトページサイズ: 10件

**TC-002: ページネーション機能**
- **Given**: 20件のブログが存在
- **When**: limit=5&page=2 でリクエスト
- **Then**: 
  - 6-10件目のブログを返す
  - pagination情報を含む

**TC-003: タイトル検索機能**
- **Given**: 検索可能なブログが存在
- **When**: search=テスト でリクエスト
- **Then**: タイトルに「テスト」を含むブログのみ返す

**TC-004: ステータスフィルタ機能**
- **Given**: published/draft両方のブログが存在
- **When**: status=published でリクエスト
- **Then**: 公開済みブログのみ返す

#### 異常系テストケース

**TC-005: 認証なしアクセス**
- **Given**: 認証トークンなし
- **When**: GET /api/blogs を呼び出す
- **Then**: 401エラー「認証が必要です」

**TC-006: 無効なページネーションパラメータ**
- **Given**: 有効な認証
- **When**: limit=-1 でリクエスト
- **Then**: 400エラー「無効なパラメータ」

### GET /api/blogs/[id] (ブログ詳細取得)

#### 正常系テストケース

**TC-007: 有効なブログID指定**
- **Given**: 存在するブログID
- **When**: GET /api/blogs/{id} を呼び出す
- **Then**: 
  - ステータス: 200
  - 完全なブログ情報を返す

**TC-008: 下書きブログの取得（作成者）**
- **Given**: 作成者が下書きブログを要求
- **When**: GET /api/blogs/{draftId} を呼び出す
- **Then**: 下書きブログ情報を返す

#### 異常系テストケース

**TC-009: 存在しないブログID**
- **Given**: 存在しないブログID
- **When**: GET /api/blogs/{nonexistentId} を呼び出す
- **Then**: 404エラー「ブログが見つかりません」

**TC-010: 他人の下書きブログアクセス**
- **Given**: 他人の下書きブログID
- **When**: GET /api/blogs/{othersPrivateId} を呼び出す
- **Then**: 403エラー「アクセス権限がありません」

### POST /api/blogs (ブログ作成)

#### 正常系テストケース

**TC-011: 有効なブログデータで作成**
- **Given**: 有効なブログデータ（title, content, status）
- **When**: POST /api/blogs でブログ作成
- **Then**: 
  - ステータス: 201
  - 作成されたブログ情報を返す
  - Firestoreに保存される

**TC-012: 下書きブログ作成**
- **Given**: status=draft でブログデータ
- **When**: POST /api/blogs でブログ作成
- **Then**: 下書き状態でブログが作成される

#### 異常系テストケース

**TC-013: 必須フィールド不足**
- **Given**: titleが空のブログデータ
- **When**: POST /api/blogs でブログ作成
- **Then**: 400エラー「必須フィールドが不足しています」

**TC-014: 無効なステータス値**
- **Given**: status=invalid でブログデータ
- **When**: POST /api/blogs でブログ作成
- **Then**: 400エラー「無効なステータス値です」

**TC-015: 認証なしでの作成試行**
- **Given**: 認証トークンなし
- **When**: POST /api/blogs でブログ作成
- **Then**: 401エラー「認証が必要です」

### PUT /api/blogs/[id] (ブログ更新)

#### 正常系テストケース

**TC-016: 自分のブログ更新**
- **Given**: 作成者による自分のブログ更新
- **When**: PUT /api/blogs/{id} で更新
- **Then**: 
  - ステータス: 200
  - 更新されたブログ情報を返す
  - updatedAtが更新される

**TC-017: 管理者による他人のブログ更新**
- **Given**: 管理者権限での他人のブログ更新
- **When**: PUT /api/blogs/{id} で更新
- **Then**: 正常に更新される

#### 異常系テストケース

**TC-018: 他人のブログ更新試行**
- **Given**: 一般ユーザーが他人のブログ更新を試行
- **When**: PUT /api/blogs/{othersId} で更新
- **Then**: 403エラー「権限がありません」

**TC-019: 存在しないブログ更新**
- **Given**: 存在しないブログID
- **When**: PUT /api/blogs/{nonexistentId} で更新
- **Then**: 404エラー「ブログが見つかりません」

### DELETE /api/blogs/[id] (ブログ削除)

#### 正常系テストケース

**TC-020: 自分のブログ削除**
- **Given**: 作成者による自分のブログ削除
- **When**: DELETE /api/blogs/{id} を呼び出す
- **Then**: 
  - ステータス: 200
  - 削除確認メッセージ
  - Firestoreから削除される

**TC-021: 管理者による削除**
- **Given**: 管理者権限での削除
- **When**: DELETE /api/blogs/{id} を呼び出す
- **Then**: 正常に削除される

#### 異常系テストケース

**TC-022: 他人のブログ削除試行**
- **Given**: 一般ユーザーが他人のブログ削除を試行
- **When**: DELETE /api/blogs/{othersId} を呼び出す
- **Then**: 403エラー「権限がありません」

**TC-023: 存在しないブログ削除**
- **Given**: 存在しないブログID
- **When**: DELETE /api/blogs/{nonexistentId} を呼び出す
- **Then**: 404エラー「ブログが見つかりません」

## セキュリティテストケース

### 認証・認可テスト

**TC-024: JWT トークン検証**
- **Given**: 無効なJWTトークン
- **When**: 任意のAPIエンドポイントを呼び出す
- **Then**: 401エラー「無効なトークンです」

**TC-025: 期限切れトークン**
- **Given**: 期限切れのJWTトークン
- **When**: 任意のAPIエンドポイントを呼び出す
- **Then**: 401エラー「トークンが期限切れです」

### 入力検証テスト

**TC-026: XSS攻撃対策**
- **Given**: `<script>alert('xss')</script>`を含むtitle
- **When**: POST /api/blogs でブログ作成
- **Then**: スクリプトがサニタイズされる

**TC-027: SQLインジェクション対策**
- **Given**: `'; DROP TABLE blogs; --`を含むcontent
- **When**: POST /api/blogs でブログ作成
- **Then**: 安全に処理される（NoSQLなので直接的影響なし）

## パフォーマンステストケース

**TC-028: 大量データでのページネーション**
- **Given**: 1000件のブログデータ
- **When**: 最後のページを要求
- **Then**: 3秒以内にレスポンス

**TC-029: 複雑な検索クエリ**
- **Given**: 複数条件での検索
- **When**: title + content + status での複合検索
- **Then**: 2秒以内にレスポンス

## エラーハンドリングテストケース

**TC-030: Firestore接続エラー**
- **Given**: Firestoreが利用不可
- **When**: 任意のAPIを呼び出す
- **Then**: 500エラー「データベース接続エラー」

**TC-031: ネットワークタイムアウト**
- **Given**: ネットワーク遅延
- **When**: 長時間のクエリ実行
- **Then**: 適切なタイムアウト処理

## テスト実装ファイル構成

```
src/app/api/blogs/
├── __tests__/
│   ├── blogs-list.test.ts          # TC-001〜TC-006
│   ├── blogs-detail.test.ts        # TC-007〜TC-010  
│   ├── blogs-create.test.ts        # TC-011〜TC-015
│   ├── blogs-update.test.ts        # TC-016〜TC-019
│   ├── blogs-delete.test.ts        # TC-020〜TC-023
│   ├── blogs-security.test.ts      # TC-024〜TC-027
│   ├── blogs-performance.test.ts   # TC-028〜TC-029
│   └── blogs-errors.test.ts        # TC-030〜TC-031
src/lib/__tests__/
├── blog-utils.test.ts              # ユーティリティ関数テスト
└── blog-validation.test.ts         # バリデーション関数テスト
```

## モック設定方針

### Firebase Admin SDK
```typescript
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      startAfter: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  })),
}));
```

### 認証ユーティリティ
```typescript
jest.mock('@/lib/auth-utils', () => ({
  extractBearerToken: jest.fn(),
  createErrorResponse: jest.fn(),
  createSuccessResponse: jest.fn(),
}));
```

## 実行順序

1. **Red Phase**: 全テストケースを実装（失敗することを確認）
2. **Green Phase**: 最小限の実装でテストを通す
3. **Refactor Phase**: コード品質とパフォーマンスを向上

## 品質基準

- **テストカバレッジ**: 95%以上
- **テスト実行時間**: 30秒以内
- **テスト成功率**: 100%（CI環境）

この仕様書に基づいて、確実で保守性の高いブログAPIを実装します。