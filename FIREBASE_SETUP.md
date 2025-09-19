# Firebase 環境構築ガイド

## 🚀 クイックスタート

現在のプロジェクト（blog-app-21219）の設定を完了させる手順です。

### 1. Firebase Console にアクセス

https://console.firebase.google.com/project/blog-app-21219

### 2. Admin SDK 設定の取得

1. Firebase Console > ⚙️ プロジェクト設定
2. 「サービス アカウント」タブをクリック
3. 「新しい秘密鍵の生成」をクリック
4. JSONファイルをダウンロード

### 3. ダウンロードしたJSONファイルから情報を抽出

ダウンロードしたJSONファイル（例：`blog-app-21219-firebase-adminsdk-xxxxx.json`）を開き、以下の値を確認：

```json
{
  "type": "service_account",
  "project_id": "blog-app-21219",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@blog-app-21219.iam.gserviceaccount.com",
  ...
}
```

### 4. .env.local の更新

現在の `.env.local` ファイルの Admin SDK セクションを以下のように更新：

```bash
# Firebase Admin (サーバー側)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@blog-app-21219.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=blog-app-21219
```

**⚠️ 重要な注意点:**
- `private_key` の値は `\n` を含めて完全にコピー
- ダブルクォートで囲む
- `client_email` は実際の値に置き換え

### 5. テストユーザーの作成

1. Firebase Console > Authentication > Users
2. 「ユーザーを追加」をクリック
3. 以下の情報で作成：
   - Email: `admin@example.com`
   - Password: `password123`

### 6. Firestore の初期化

1. Firebase Console > Firestore Database
2. 「データベースの作成」
3. 「テストモードで開始」を選択
4. ロケーション：`asia-northeast1`（日本）

### 7. Storage の初期化

1. Firebase Console > Storage
2. 「始める」をクリック
3. 「テストモードで開始」を選択

### 8. 動作確認

1. 開発サーバーを再起動：
   ```bash
   npm run dev
   ```

2. http://localhost:3000 にアクセス

3. ログイン情報：
   - Email: `admin@example.com`
   - Password: `password123`

4. Firebase接続テスト：
   - ダッシュボード > 「Firebase テストページへ」をクリック

## 🔍 トラブルシューティング

### 認証エラーの場合

1. `.env.local` のAdmin SDK設定を確認
2. `FIREBASE_PRIVATE_KEY` が正しく設定されているか確認
3. 開発サーバーを再起動

### "auth/invalid-credential" エラー

1. Firebase Console でユーザーが作成されているか確認
2. メール/パスワード認証が有効化されているか確認

### "Permission denied" エラー

1. Firestore のセキュリティルールを確認
2. テストモードで開始されているか確認

## 📋 設定完了チェックリスト

- [ ] Admin SDK JSONファイルをダウンロード
- [ ] `.env.local` のAdmin SDK設定を更新
- [ ] テストユーザー（admin@example.com）を作成
- [ ] Firestoreデータベースを初期化
- [ ] Storageを初期化
- [ ] 開発サーバーを再起動
- [ ] ログインテストが成功
- [ ] Firebase接続テストが成功

## 🎯 次のステップ

設定が完了したら、以下の機能開発に進むことができます：

1. ブログ記事管理機能
2. メンバー管理機能
3. 画像アップロード機能