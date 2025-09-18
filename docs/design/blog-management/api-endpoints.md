# API エンドポイント仕様

## 概要

Next.js API Routes を使用したRESTful API設計。Firebase との統合と認証を考慮したエンドポイント仕様。

## 認証方式

- Firebase Authentication JWT トークン
- `Authorization: Bearer <token>` ヘッダー
- 管理者権限のチェック

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": <response_data>
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

### ページネーション付きレスポンス
```json
{
  "success": true,
  "data": {
    "items": [<item1>, <item2>, ...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 認証 API

### POST /api/auth/login
管理者ログイン

**リクエスト:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "admin@example.com",
      "name": "管理者",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-01T12:00:00Z"
    },
    "token": "jwt_token_here",
    "expiresAt": "2024-01-01T13:00:00Z"
  }
}
```

**エラー:**
- `400` - バリデーションエラー
- `401` - 認証失敗
- `500` - サーバーエラー

### POST /api/auth/logout
ログアウト

**リクエスト:** 認証ヘッダーのみ

**レスポンス:**
```json
{
  "success": true,
  "data": {}
}
```

### GET /api/auth/me
現在のユーザー情報取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "admin@example.com",
      "name": "管理者",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

---

## ブログ記事 API

### GET /api/blogs
ブログ記事一覧取得

**クエリパラメータ:**
- `page?: number` - ページ番号 (デフォルト: 1)
- `limit?: number` - 1ページあたりの件数 (デフォルト: 10, 最大: 100)
- `status?: 'draft' | 'published'` - ステータスフィルタ
- `keyword?: string` - タイトル・本文の検索キーワード
- `authorId?: string` - 作成者IDフィルタ
- `sortBy?: 'createdAt' | 'updatedAt' | 'title'` - ソート項目 (デフォルト: createdAt)
- `sortOrder?: 'asc' | 'desc'` - ソート順 (デフォルト: desc)

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "blog123",
        "title": "記事タイトル",
        "content": "記事本文...",
        "status": "published",
        "imageUrl": "https://...",
        "authorId": "user123",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /api/blogs/[id]
ブログ記事詳細取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "blog123",
    "title": "記事タイトル",
    "content": "記事本文...",
    "status": "published",
    "imageUrl": "https://...",
    "authorId": "user123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**エラー:**
- `404` - 記事が見つからない

### POST /api/blogs
ブログ記事作成

**リクエスト:**
```json
{
  "title": "新しい記事のタイトル",
  "content": "記事の本文内容...",
  "status": "draft",
  "imageUrl": "https://storage.example.com/image.jpg"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "blog456",
    "title": "新しい記事のタイトル",
    "content": "記事の本文内容...",
    "status": "draft",
    "imageUrl": "https://storage.example.com/image.jpg",
    "authorId": "user123",
    "createdAt": "2024-01-01T01:00:00Z",
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

**エラー:**
- `400` - バリデーションエラー
- `401` - 認証が必要
- `403` - 権限不足

### PUT /api/blogs/[id]
ブログ記事更新

**リクエスト:**
```json
{
  "title": "更新されたタイトル",
  "content": "更新された本文...",
  "status": "published",
  "imageUrl": "https://storage.example.com/new-image.jpg"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "blog123",
    "title": "更新されたタイトル",
    "content": "更新された本文...",
    "status": "published",
    "imageUrl": "https://storage.example.com/new-image.jpg",
    "authorId": "user123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T02:00:00Z"
  }
}
```

**エラー:**
- `400` - バリデーションエラー
- `404` - 記事が見つからない
- `403` - 権限不足

### DELETE /api/blogs/[id]
ブログ記事削除

**レスポンス:**
```json
{
  "success": true,
  "data": {}
}
```

**エラー:**
- `404` - 記事が見つからない
- `403` - 権限不足

---

## メンバー管理 API

### GET /api/members
メンバー一覧取得

**クエリパラメータ:**
- `page?: number` - ページ番号 (デフォルト: 1)
- `limit?: number` - 1ページあたりの件数 (デフォルト: 10, 最大: 100)
- `category?: 'teacher' | 'student'` - カテゴリフィルタ
- `position?: string` - 職位・学年フィルタ
- `isActive?: boolean` - 在籍状況フィルタ
- `keyword?: string` - 名前・自己紹介の検索キーワード
- `sortBy?: 'createdAt' | 'name' | 'position'` - ソート項目 (デフォルト: name)
- `sortOrder?: 'asc' | 'desc'` - ソート順 (デフォルト: asc)

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "member123",
        "name": "山田太郎",
        "category": "teacher",
        "position": "教授",
        "description": "専門は機械学習です...",
        "profileImageUrl": "https://...",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /api/members/[id]
メンバー詳細取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "member123",
    "name": "山田太郎",
    "category": "teacher",
    "position": "教授",
    "description": "専門は機械学習です...",
    "profileImageUrl": "https://...",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/members
メンバー作成

**リクエスト:**
```json
{
  "name": "佐藤花子",
  "category": "student",
  "position": "修士",
  "description": "自然言語処理を研究しています...",
  "profileImageUrl": "https://storage.example.com/profile.jpg",
  "isActive": true
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "member456",
    "name": "佐藤花子",
    "category": "student",
    "position": "修士",
    "description": "自然言語処理を研究しています...",
    "profileImageUrl": "https://storage.example.com/profile.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T01:00:00Z",
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

### PUT /api/members/[id]
メンバー更新

**リクエスト:**
```json
{
  "name": "佐藤花子",
  "category": "student",
  "position": "博士",
  "description": "博士課程に進学しました...",
  "profileImageUrl": "https://storage.example.com/new-profile.jpg",
  "isActive": true
}
```

### DELETE /api/members/[id]
メンバー削除

**レスポンス:**
```json
{
  "success": true,
  "data": {}
}
```

---

## ファイルアップロード API

### POST /api/upload/blog-image
ブログ記事画像アップロード

**リクエスト:** `multipart/form-data`
- `file: File` - 画像ファイル (最大5MB)

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/bucket/blog-images/uuid.jpg",
    "path": "blog-images/uuid.jpg",
    "metadata": {
      "size": 1024000,
      "contentType": "image/jpeg",
      "name": "original-filename.jpg"
    }
  }
}
```

**エラー:**
- `400` - ファイル形式・サイズエラー
- `401` - 認証が必要

### POST /api/upload/member-profile
メンバープロフィール画像アップロード

**リクエスト:** `multipart/form-data`
- `file: File` - 画像ファイル (最大2MB)

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/bucket/member-profiles/uuid.jpg",
    "path": "member-profiles/uuid.jpg",
    "metadata": {
      "size": 512000,
      "contentType": "image/jpeg",
      "name": "profile.jpg"
    }
  }
}
```

### DELETE /api/upload/[path]
ファイル削除

**レスポンス:**
```json
{
  "success": true,
  "data": {}
}
```

---

## バリデーション仕様

### ブログ記事
- `title`: 必須、1-100文字
- `content`: 必須、1-10,000文字
- `status`: 必須、'draft' | 'published'
- `imageUrl`: 任意、有効なURL形式

### メンバー
- `name`: 必須、1-50文字
- `category`: 必須、'teacher' | 'student'
- `position`: 必須、カテゴリに応じた有効な職位・学年
- `description`: 必須、1-500文字
- `profileImageUrl`: 任意、有効なURL形式
- `isActive`: 必須、boolean

### ファイルアップロード
- **ブログ画像**: JPEG/PNG/WebP、最大5MB
- **プロフィール画像**: JPEG/PNG/WebP、最大2MB

## エラーコード一覧

| コード | メッセージ | 詳細 |
|--------|------------|------|
| `VALIDATION_ERROR` | バリデーションエラー | リクエストデータの形式が不正 |
| `AUTHENTICATION_REQUIRED` | 認証が必要です | 認証トークンが無効または未提供 |
| `PERMISSION_DENIED` | 権限がありません | 管理者権限が必要 |
| `RESOURCE_NOT_FOUND` | リソースが見つかりません | 指定されたIDのリソースが存在しない |
| `FILE_TOO_LARGE` | ファイルサイズが大きすぎます | アップロードファイルがサイズ制限を超過 |
| `INVALID_FILE_TYPE` | 無効なファイル形式です | 許可されていないファイル形式 |
| `INTERNAL_SERVER_ERROR` | サーバーエラーが発生しました | 予期しないサーバーエラー |

## レート制限

- 一般的なAPI: 100リクエスト/分/IP
- ファイルアップロード: 10リクエスト/分/IP
- 認証API: 5リクエスト/分/IP

## CORS設定

```javascript
// Next.js API Route での CORS 設定例
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com']
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

## ヘルスチェック

### GET /api/health
システム状態確認

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0",
    "services": {
      "firebase": "connected",
      "storage": "connected"
    }
  }
}
```