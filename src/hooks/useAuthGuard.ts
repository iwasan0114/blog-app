import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export interface UseAuthGuardResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  redirectToLogin: () => void;
}

export const useAuthGuard = (): UseAuthGuardResult => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 管理者権限チェック（メモ化）
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  // リダイレクト関数（メモ化）
  const redirectToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  return {
    isAuthenticated,
    isAdmin,
    isLoading,
    redirectToLogin,
  };
};
