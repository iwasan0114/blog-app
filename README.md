# ブログ管理アプリ

Next.js 14とFirebaseを使用したブログ・メンバー管理システムです。

## 機能

- ✅ Firebase Authentication（ログイン・ログアウト）
- ✅ ブログ記事管理（予定）
- ✅ メンバー管理（予定）
- ✅ TypeScript型安全性
- ✅ Tailwind CSS + Shadcn/ui

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **認証**: Firebase Authentication
- **データベース**: Firestore
- **ストレージ**: Firebase Storage
- **UI**: Tailwind CSS + Shadcn/ui
- **フォーム**: React Hook Form + Zod
- **言語**: TypeScript

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd blog-app
npm install
```

### 2. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `blog-app-yourname`）
4. Google Analytics は任意で設定
5. プロジェクトを作成

### 3. Firebase Authentication の設定

1. Firebase Console > 「Authentication」
2. 「始める」をクリック
3. 「Sign-in method」タブ
4. 「メール/パスワード」を有効化
5. 「Users」タブでテストユーザーを作成：
   - Email: `admin@example.com`
   - Password: `password123`

### 4. Firestore Database の設定

1. Firebase Console > 「Firestore Database」
2. 「データベースの作成」
3. 「テストモードで開始」を選択
4. ロケーションを選択（asia-northeast1 推奨）

### 5. Firebase Storage の設定

1. Firebase Console > 「Storage」
2. 「始める」をクリック
3. 「テストモードで開始」を選択
4. ロケーションを選択（Firestoreと同じ推奨）

### 6. Firebase 設定の取得

#### Web アプリの設定

1. Firebase Console > プロジェクト設定（歯車アイコン）
2. 「マイアプリ」セクション > 「ウェブアプリを追加」
3. アプリのニックネームを入力
4. Firebase Hosting は任意
5. 設定情報をコピー

#### Admin SDK の設定

1. Firebase Console > プロジェクト設定 > 「サービス アカウント」タブ
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード

### 7. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を設定：

```bash
# Firebase Configuration (クライアント側)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (サーバー側)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=your_project_id

# Application
NEXTAUTH_SECRET=your_random_secret_key_change_in_production
NEXTAUTH_URL=http://localhost:3000
```

**設定方法:**

1. **クライアント側設定**: Web アプリ設定から値をコピー
2. **Admin SDK設定**: ダウンロードしたJSONファイルから以下を抽出：
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `project_id` → `FIREBASE_PROJECT_ID`

### 8. Firestore セキュリティルール

`firestore.rules` ファイルが自動で設定されています。本番環境では適切なセキュリティルールに変更してください。

### 9. アプリケーションの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

### 10. ログイン

デフォルトのログイン情報：
- Email: `admin@example.com`
- Password: `password123`

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# Lint
npm run lint

# Lint修正
npm run lint:fix
```

## Firebase テスト

アプリケーション内の `/test-firebase` ページで Firebase 接続をテストできます。

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/          # ダッシュボード
│   ├── login/             # ログインページ
│   └── test-firebase/     # Firebase テスト
├── components/            # React コンポーネント
│   ├── auth/             # 認証関連
│   └── ui/               # UI コンポーネント (Shadcn/ui)
├── contexts/             # React Context
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティ・設定
│   ├── types/           # TypeScript型定義
│   ├── firebase.ts      # Firebase クライアント設定
│   ├── firebase-admin.ts # Firebase Admin設定
│   └── utils.ts         # ユーティリティ関数
└── scripts/              # スクリプト
```

## トラブルシューティング

### 認証エラー

1. `.env.local` の設定を確認
2. Firebase Console で Authentication が有効化されているか確認
3. ユーザーが作成されているか確認

### ビルドエラー

```bash
npm run lint:fix
npm run build
```

### Firebase 接続エラー

`/test-firebase` ページで各サービスの接続状態を確認

## デプロイ

### Vercel へのデプロイ

1. Vercel にプロジェクトをインポート
2. 環境変数を Vercel のダッシュボードで設定
3. `NEXTAUTH_URL` を本番URLに変更

### Firebase Hosting へのデプロイ

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## ライセンス

MIT License

## 開発者

作成者：Claude Code Assistant