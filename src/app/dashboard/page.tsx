'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container-custom py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              ブログ管理ダッシュボード
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                ようこそ、{user?.name}さん
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
                <CardTitle className="text-lg">ブログ記事管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ブログ記事の作成、編集、削除を管理できます。
                </p>
                <Button className="w-full" disabled>
                  記事管理（準備中）
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">メンバー管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  チームメンバーの情報を管理できます。
                </p>
                <Button className="w-full" disabled>
                  メンバー管理（準備中）
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">システム設定</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  アプリケーションの各種設定を管理できます。
                </p>
                <Button className="w-full" disabled>
                  設定（準備中）
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Firebase 接続テスト</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Firebase の接続状態を確認できます。
                </p>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/test-firebase')}
                >
                  Firebase テストページへ
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
