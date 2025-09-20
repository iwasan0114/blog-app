'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
  fallback,
  redirectTo = '/login',
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 管理者権限チェック（メモ化）
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // ローディング中
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div
            data-testid="auth-loading"
            className="text-center"
            role="status"
            aria-label="認証状態を確認中"
          >
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"
              aria-hidden="true"
            ></div>
            <p className="mt-2 text-gray-600">認証状態を確認中...</p>
          </div>
        </div>
      )
    );
  }

  // 未認証の場合はnullを返す（リダイレクト処理はuseEffectで行う）
  if (!isAuthenticated) {
    return null;
  }

  // 管理者権限が必要だが、ユーザーが管理者でない場合
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="text-center max-w-md mx-auto px-4"
          role="alert"
          aria-labelledby="access-denied-title"
        >
          <h1
            id="access-denied-title"
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            アクセス権限がありません
          </h1>
          <p className="text-gray-600 mb-6">
            このページにアクセスするには管理者権限が必要です。
          </p>
          <p className="text-sm text-red-600 mb-6">
            権限が不足しています。管理者にお問い合わせください。
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="ダッシュボードに戻る"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  // 認証済みかつ権限チェックを通過した場合、子コンポーネントを表示
  return <>{children}</>;
};
