# Firestore データベーススキーマ設計

## 概要

Firebase Firestoreを使用したNoSQLデータベース設計。コレクション構造とセキュリティルール、インデックス戦略を定義する。

## コレクション構造

### 1. blogs コレクション

```
/blogs/{blogId}
```

#### フィールド定義
```typescript
{
  id: string,                    // ドキュメントID
  title: string,                 // 記事タイトル（最大100文字）
  content: string,               // 記事本文（最大10,000文字）
  status: 'draft' | 'published', // 公開ステータス
  imageUrl?: string,             // 画像URL（Firebase Storage）
  authorId: string,              // 作成者ID（users コレクションを参照）
  createdAt: Timestamp,          // 作成日時
  updatedAt: Timestamp           // 更新日時
}
```

#### インデックス
```
// 複合インデックス
1. status + createdAt (DESC)     // 公開記事の新着順取得
2. authorId + createdAt (DESC)   // 作成者別記事取得
3. status + updatedAt (DESC)     // ステータス別更新順

// 単一フィールドインデックス（自動作成）
- title
- status
- authorId
- createdAt
- updatedAt
```

### 2. members コレクション

```
/members/{memberId}
```

#### フィールド定義
```typescript
{
  id: string,                    // ドキュメントID
  name: string,                  // メンバー名（最大50文字）
  category: 'teacher' | 'student', // カテゴリ
  position: string,              // 職位・学年（enum値）
  description: string,           // 自己紹介（最大500文字）
  profileImageUrl?: string,      // プロフィール画像URL
  isActive: boolean,             // 在籍状況
  createdAt: Timestamp,          // 作成日時
  updatedAt: Timestamp           // 更新日時
}
```

#### インデックス
```
// 複合インデックス
1. category + position + name    // カテゴリ別職位順並び
2. isActive + category + name    // 在籍中メンバーのカテゴリ別取得
3. isActive + createdAt (DESC)   // 在籍中メンバーの新着順

// 単一フィールドインデックス（自動作成）
- name
- category
- position
- isActive
- createdAt
- updatedAt
```

### 3. users コレクション

```
/users/{userId}
```

#### フィールド定義
```typescript
{
  id: string,                    // ドキュメントID（Firebase Auth UIDと同一）
  email: string,                 // メールアドレス
  name: string,                  // 管理者名
  role: 'admin',                 // 管理者権限
  createdAt: Timestamp,          // 作成日時
  lastLoginAt: Timestamp         // 最終ログイン日時
}
```

#### インデックス
```
// 単一フィールドインデックス
- email
- role
- lastLoginAt
```

## セキュリティルール

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 管理者認証の確認関数
    function isAdmin() {
      return request.auth != null 
        && request.auth.uid != null
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // blogs コレクション
    match /blogs/{blogId} {
      allow read, write: if isAdmin();
      
      // バリデーション
      allow create: if isAdmin()
        && request.resource.data.keys().hasAll(['title', 'content', 'status', 'authorId', 'createdAt', 'updatedAt'])
        && request.resource.data.title is string
        && request.resource.data.title.size() <= 100
        && request.resource.data.content is string
        && request.resource.data.content.size() <= 10000
        && request.resource.data.status in ['draft', 'published']
        && request.resource.data.authorId == request.auth.uid;
        
      allow update: if isAdmin()
        && request.resource.data.authorId == resource.data.authorId
        && request.resource.data.createdAt == resource.data.createdAt;
    }
    
    // members コレクション
    match /members/{memberId} {
      allow read, write: if isAdmin();
      
      // バリデーション
      allow create: if isAdmin()
        && request.resource.data.keys().hasAll(['name', 'category', 'position', 'description', 'isActive', 'createdAt', 'updatedAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() <= 50
        && request.resource.data.category in ['teacher', 'student']
        && request.resource.data.position is string
        && request.resource.data.description is string
        && request.resource.data.description.size() <= 500
        && request.resource.data.isActive is bool;
        
      allow update: if isAdmin()
        && request.resource.data.createdAt == resource.data.createdAt;
    }
    
    // users コレクション
    match /users/{userId} {
      allow read: if isAdmin() && userId == request.auth.uid;
      allow write: if false; // 管理者アカウントの作成・更新は別途実装
    }
  }
}
```

### Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // 管理者認証の確認
    function isAdmin() {
      return request.auth != null && request.auth.uid != null;
    }
    
    // ブログ画像
    match /blog-images/{allPaths=**} {
      allow read, write: if isAdmin()
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 5 * 1024 * 1024; // 5MB制限
    }
    
    // メンバープロフィール画像
    match /member-profiles/{allPaths=**} {
      allow read, write: if isAdmin()
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 2 * 1024 * 1024; // 2MB制限
    }
  }
}
```

## データモデリング戦略

### 1. 非正規化の活用

```typescript
// ブログ記事に作成者情報を埋め込み（読み取り効率化）
interface BlogWithAuthor extends Blog {
  author: {
    id: string;
    name: string;
    email: string;
  };
}
```

### 2. サブコレクションの活用

```
// 将来的な拡張: ブログのコメント機能
/blogs/{blogId}/comments/{commentId}
{
  content: string,
  authorId: string,
  createdAt: Timestamp
}

// 将来的な拡張: 操作ログ
/users/{userId}/activities/{activityId}
{
  action: string,
  targetType: string,
  targetId: string,
  timestamp: Timestamp
}
```

## パフォーマンス最適化

### 1. ページネーション戦略

```typescript
// カーソルベースページネーション
const getBlogs = async (lastDocument?: DocumentSnapshot, limit = 10) => {
  let query = collection(db, 'blogs')
    .where('status', '==', 'published')
    .orderBy('createdAt', 'desc')
    .limit(limit);
    
  if (lastDocument) {
    query = query.startAfter(lastDocument);
  }
  
  return getDocs(query);
};
```

### 2. リアルタイム更新の最適化

```typescript
// 必要な場合のみリアルタイムリスナーを設定
const useRealtimeBlogs = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = onSnapshot(
      collection(db, 'blogs'),
      (snapshot) => {
        // 変更された記事のみ処理
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            // 新規記事追加処理
          } else if (change.type === 'modified') {
            // 記事更新処理
          } else if (change.type === 'removed') {
            // 記事削除処理
          }
        });
      }
    );
    
    return unsubscribe;
  }, [enabled]);
};
```

## バックアップとデータ整合性

### 1. 定期バックアップ

```typescript
// Firebase Functions でのバックアップ処理例
export const scheduledBackup = functions.pubsub
  .schedule('0 2 * * *') // 毎日午前2時
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    // Firestore Export API を使用
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const outputUriPrefix = `gs://${projectId}-backups/${new Date().toISOString()}`;
    
    // バックアップ実行
    await firestore.databasePath(projectId, '(default)').export({
      outputUriPrefix,
      collectionIds: ['blogs', 'members', 'users']
    });
  });
```

### 2. データ整合性チェック

```typescript
// 孤立した画像ファイルの検出・削除
export const cleanupOrphanedImages = functions.https.onCall(async (data, context) => {
  // 認証チェック
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  
  // Firestore からアクティブな画像URLを取得
  const activeImageUrls = new Set();
  
  const [blogsSnapshot, membersSnapshot] = await Promise.all([
    firestore.collection('blogs').get(),
    firestore.collection('members').get()
  ]);
  
  // アクティブな画像URLを収集
  blogsSnapshot.docs.forEach(doc => {
    const imageUrl = doc.data().imageUrl;
    if (imageUrl) activeImageUrls.add(imageUrl);
  });
  
  membersSnapshot.docs.forEach(doc => {
    const profileImageUrl = doc.data().profileImageUrl;
    if (profileImageUrl) activeImageUrls.add(profileImageUrl);
  });
  
  // Storage の画像ファイルをチェックし、未使用ファイルを削除
  // 実装詳細は省略
});
```

## マイグレーション戦略

### 1. スキーマ変更時の対応

```typescript
// フィールド追加時のマイグレーション例
export const migrateAddCategoryField = functions.https.onCall(async (data, context) => {
  const batch = firestore.batch();
  
  const membersSnapshot = await firestore.collection('members').get();
  
  membersSnapshot.docs.forEach(doc => {
    const memberData = doc.data();
    
    // position から category を推定
    const category = inferCategoryFromPosition(memberData.position);
    
    batch.update(doc.ref, { 
      category,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
});

function inferCategoryFromPosition(position: string): 'teacher' | 'student' {
  const teacherPositions = ['教授', '准教授', '助教', '講師'];
  return teacherPositions.includes(position) ? 'teacher' : 'student';
}
```

## 運用監視

### 1. 使用量アラート

```typescript
// Cloud Monitoring でのアラート設定例
const alertPolicy = {
  displayName: 'Firestore High Read Operations',
  conditions: [{
    displayName: 'Firestore read operations',
    conditionThreshold: {
      filter: 'resource.type="firestore_database"',
      comparison: 'COMPARISON_GT',
      thresholdValue: 50000, // 1日50,000回読み取り
      duration: '300s'
    }
  }],
  notificationChannels: ['notification-channel-id']
};
```

### 2. パフォーマンス監視

```typescript
// カスタムメトリクスの記録
const recordCustomMetric = (operation: string, duration: number) => {
  // Cloud Monitoring カスタムメトリクス
  console.log(`METRIC: ${operation}_duration=${duration}ms`);
};

// 使用例
const start = Date.now();
await createBlog(blogData);
recordCustomMetric('create_blog', Date.now() - start);
```