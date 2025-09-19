'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <AuthGuard requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container-custom py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              管理者専用ページ
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                管理者: {user?.name}さん
              </span>
              <Button variant="outline" onClick={handleLogout}>
                ログアウト
              </Button>
            </div>
          </div>
        </header>

        <main className="container-custom py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">システム設定</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  システム全体の設定を管理します。
                </p>
                <Button className="w-full" disabled>
                  設定管理（準備中）
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">ユーザー管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ユーザーの権限と情報を管理します。
                </p>
                <Button className="w-full" disabled>
                  ユーザー管理（準備中）
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">ログ監視</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  システムログとアクセスログを確認します。
                </p>
                <Button className="w-full" disabled>
                  ログ確認（準備中）
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>認証ガードテスト</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  このページは管理者権限が必要です。一般ユーザーはアクセスできません。
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ 管理者権限で正常にアクセスできています！
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}