# ブログ管理Webアプリケーション
ブログ管理システムです。

## 🚀 技術スタック

### フロントエンド・バックエンド
- **Remix**
- **TypeScript**
- **Tailwind CSS**

### データベース
- **PostgreSQL**
- **Prisma ORM**

### 認証
- **Remix Auth**

### テスト
- **Vitest** - 高速なテストランナー
- **Testing Library** - コンポーネントテスト
- **MSW** - APIモック（Mock Service Worker）
- **Playwright** - E2Eテスト

### デプロイ
- **Vercel** / **Netlify** / **Railway** - ホスティング

## 🎯 主要機能

- ✅ ユーザー認証（ログイン・ログアウト・登録）
- ✅ 記事のCRUD操作（作成・読み取り・更新・削除）
- ✅ カテゴリ管理
- ✅ 記事検索・フィルタリング
- ✅ ファイルアップロード（画像・添付ファイル）
- ✅ レスポンシブデザイン
- ✅ SEO最適化

### セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd blog-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env

# データベースのセットアップ
npx prisma migrate dev
npx prisma generate

# 開発サーバーの起動
npm run dev
```

## 📝 開発ガイドライン

### コーディング規約
- TypeScriptの厳密モードを使用
- ESLint + Prettierでコードフォーマット
- コミット前にテストが通ることを確認

### ブランチ戦略
- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `test/*`: テスト関連

## 📚 参考資料

- [Remix公式ドキュメント](https://remix.run/docs)
- [Prisma公式ドキュメント](https://www.prisma.io/docs)
- [Testing Library](https://testing-library.com/)
- [Vitest](https://vitest.dev/)

