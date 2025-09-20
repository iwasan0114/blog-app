import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// AuthContext のモック
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('AuthGuard', () => {
  const mockPush = jest.fn();
  const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  describe('ローディング状態', () => {
    test('デフォルトローディング表示', () => {
      // Given: 認証状態確認中
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: AuthGuardを描画
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: デフォルトローディングUIが表示される
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
      expect(screen.getByText('認証状態を確認中...')).toBeInTheDocument();
    });

    test('カスタムfallback表示', () => {
      // Given: 認証状態確認中 & カスタムfallback指定
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      const customFallback = (
        <div data-testid="custom-loading">Custom Loading</div>
      );

      // When: AuthGuardを描画
      render(
        <AuthGuard fallback={customFallback}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: カスタムfallbackが表示される
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    });
  });

  describe('未認証ユーザー', () => {
    test('未認証時は子コンポーネントを表示しない', () => {
      // Given: ユーザーが未認証
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: AuthGuardを描画
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: 保護されたコンテンツは表示されない
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('認証済みユーザー（一般）', () => {
    const generalUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user' as const,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    test('管理者権限不要時のアクセス許可', () => {
      // Given: 一般ユーザーが認証済み & requireAdmin=false
      mockUseAuth.mockReturnValue({
        user: generalUser,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: AuthGuardを描画
      render(
        <AuthGuard requireAdmin={false}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: childrenが表示される
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('管理者権限必要時のアクセス拒否', () => {
      // Given: 一般ユーザーが認証済み & requireAdmin=true
      mockUseAuth.mockReturnValue({
        user: generalUser,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: AuthGuardを描画
      render(
        <AuthGuard requireAdmin={true}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: 権限不足エラーメッセージが表示される
      expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
      expect(
        screen.getByText('このページにアクセスするには管理者権限が必要です。')
      ).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('認証済みユーザー（管理者）', () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    test('管理者権限不要時のアクセス許可', () => {
      // Given: 管理者が認証済み & requireAdmin=false
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: AuthGuardを描画
      render(
        <AuthGuard requireAdmin={false}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: childrenが表示される
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('管理者権限必要時のアクセス許可', () => {
      // Given: 管理者が認証済み & requireAdmin=true
      mockUseAuth.mockReturnValue({
        user: adminUser,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: AuthGuardを描画
      render(
        <AuthGuard requireAdmin={true}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: childrenが表示される
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('権限不足エラー表示', () => {
    test('権限不足エラーメッセージの詳細確認', () => {
      const generalUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user' as const,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      // Given: 一般ユーザー & requireAdmin=true
      mockUseAuth.mockReturnValue({
        user: generalUser,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: AuthGuardを描画
      render(
        <AuthGuard requireAdmin={true}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Then: 適切なエラーメッセージが表示される
      expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
      expect(
        screen.getByText('このページにアクセスするには管理者権限が必要です。')
      ).toBeInTheDocument();
      expect(
        screen.getByText('権限が不足しています。管理者にお問い合わせください。')
      ).toBeInTheDocument();
    });
  });
});
