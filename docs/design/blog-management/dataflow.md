# データフロー図

## システム全体のデータフロー

```mermaid
flowchart TD
    A[管理者] --> B[Next.js Frontend]
    B --> C[Firebase Authentication]
    B --> D[Firestore Database]
    B --> E[Firebase Storage]
    B --> F[Firebase Hosting]
    
    C --> G[認証トークン]
    D --> H[ブログ記事データ]
    D --> I[メンバーデータ]
    E --> J[画像ファイル]
    
    G --> B
    H --> B
    I --> B
    J --> B
```

## 認証フロー

```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant Frontend as Next.js App
    participant Auth as Firebase Auth
    participant DB as Firestore
    
    Admin->>Frontend: ログイン画面アクセス
    Frontend->>Admin: ログインフォーム表示
    Admin->>Frontend: Email/Password入力
    Frontend->>Auth: signInWithEmailAndPassword()
    Auth-->>Frontend: 認証トークン + ユーザー情報
    Frontend->>DB: 管理者権限確認
    DB-->>Frontend: 権限情報
    Frontend-->>Admin: 管理画面リダイレクト
```

## ブログ記事管理フロー

### 記事作成フロー
```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant Frontend as Next.js App
    participant Storage as Firebase Storage
    participant DB as Firestore
    
    Admin->>Frontend: 新規記事作成
    Frontend->>Admin: 記事作成フォーム表示
    Admin->>Frontend: 記事情報 + 画像入力
    Frontend->>Storage: 画像アップロード
    Storage-->>Frontend: 画像URL
    Frontend->>DB: 記事データ保存
    Note over DB: blogs/{docId}
    DB-->>Frontend: 保存完了
    Frontend-->>Admin: 成功メッセージ表示
```

### 記事編集フロー
```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant Frontend as Next.js App
    participant DB as Firestore
    participant Storage as Firebase Storage
    
    Admin->>Frontend: 記事編集画面アクセス
    Frontend->>DB: 記事データ取得
    DB-->>Frontend: 既存記事データ
    Frontend->>Admin: 編集フォーム表示（既存データ入力済み）
    Admin->>Frontend: 記事情報更新
    
    alt 新しい画像がある場合
        Frontend->>Storage: 新画像アップロード
        Storage-->>Frontend: 新画像URL
        Frontend->>Storage: 旧画像削除
    end
    
    Frontend->>DB: 記事データ更新
    DB-->>Frontend: 更新完了
    Frontend-->>Admin: 成功メッセージ表示
```

### 記事削除フロー
```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant Frontend as Next.js App
    participant DB as Firestore
    participant Storage as Firebase Storage
    
    Admin->>Frontend: 記事削除ボタンクリック
    Frontend->>Admin: 削除確認ダイアログ表示
    Admin->>Frontend: 削除実行
    Frontend->>DB: 記事データ削除
    DB-->>Frontend: 削除完了
    Frontend->>Storage: 関連画像削除
    Storage-->>Frontend: 削除完了
    Frontend-->>Admin: 成功メッセージ表示
```

## メンバー管理フロー

### メンバー追加フロー
```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant Frontend as Next.js App
    participant Storage as Firebase Storage
    participant DB as Firestore
    
    Admin->>Frontend: 新規メンバー追加
    Frontend->>Admin: メンバー追加フォーム表示
    Admin->>Frontend: メンバー情報 + プロフィール画像入力
    Frontend->>Storage: プロフィール画像アップロード
    Storage-->>Frontend: 画像URL
    Frontend->>DB: メンバーデータ保存
    Note over DB: members/{docId}
    DB-->>Frontend: 保存完了
    Frontend-->>Admin: 成功メッセージ表示
```

## データ取得・表示フロー

### 記事一覧表示フロー
```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant Frontend as Next.js App
    participant DB as Firestore
    
    Admin->>Frontend: 記事一覧画面アクセス
    Frontend->>DB: 記事一覧取得（ページネーション）
    Note over DB: blogs コレクション<br/>orderBy('createdAt', 'desc')<br/>limit(10)
    DB-->>Frontend: 記事一覧データ
    Frontend->>Admin: 記事一覧表示（タイトル、作成日、ステータス）
    
    alt さらに記事を読み込む場合
        Admin->>Frontend: 「もっと見る」ボタンクリック
        Frontend->>DB: 次のページ取得
        Note over DB: startAfter(lastDocument)
        DB-->>Frontend: 追加記事データ
        Frontend->>Admin: 記事一覧に追加表示
    end
```

## リアルタイム同期フロー

```mermaid
sequenceDiagram
    participant Admin1 as 管理者A
    participant Admin2 as 管理者B
    participant Frontend1 as Next.js App A
    participant Frontend2 as Next.js App B
    participant DB as Firestore
    
    Frontend1->>DB: リアルタイムリスナー設定
    Frontend2->>DB: リアルタイムリスナー設定
    
    Admin1->>Frontend1: 記事を編集・保存
    Frontend1->>DB: 記事データ更新
    DB-->>Frontend1: 更新完了
    DB-->>Frontend2: データ変更通知
    Frontend2->>Admin2: 記事一覧自動更新
```

## エラーハンドリングフロー

```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant Frontend as Next.js App
    participant Firebase as Firebase Services
    
    Admin->>Frontend: 操作実行
    Frontend->>Firebase: API呼び出し
    
    alt 成功の場合
        Firebase-->>Frontend: 成功レスポンス
        Frontend-->>Admin: 成功メッセージ表示
    else ネットワークエラー
        Firebase-->>Frontend: NetworkError
        Frontend-->>Admin: 「接続エラー。再試行してください」
    else 権限エラー
        Firebase-->>Frontend: PermissionError
        Frontend-->>Admin: 「権限がありません」
    else バリデーションエラー
        Frontend-->>Admin: 「入力内容を確認してください」
    else その他のエラー
        Firebase-->>Frontend: UnknownError
        Frontend-->>Admin: 「エラーが発生しました」
    end
```

## データ構造とフロー

### Firestore コレクション構造
```
/blogs/{blogId}
├── title: string
├── content: string
├── status: "draft" | "published"
├── imageUrl?: string
├── createdAt: timestamp
├── updatedAt: timestamp
└── authorId: string

/members/{memberId}
├── name: string
├── position: string
├── description: string
├── profileImageUrl?: string
├── isActive: boolean
├── createdAt: timestamp
└── updatedAt: timestamp

/users/{userId}
├── email: string
├── name: string
├── role: "admin"
├── createdAt: timestamp
└── lastLoginAt: timestamp
```