import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthGuard } from '../AuthGuard';

// AuthGuardをモック
jest.mock('../AuthGuard', () => ({
  AuthGuard: jest.fn(({ children }) => (
    <div data-testid="auth-guard">{children}</div>
  )),
}));

describe('ProtectedRoute', () => {
  const mockAuthGuard = AuthGuard as jest.MockedFunction<typeof AuthGuard>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レガシー互換性', () => {
    test('AuthGuardのラッパーとして機能', () => {
      // Given: ProtectedRouteコンポーネント
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Then: AuthGuardコンポーネントが呼び出される
      expect(mockAuthGuard).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('auth-guard')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('propsの正しい受け渡し - requireAdmin', () => {
      // Given: ProtectedRouteにrequireAdminプロパティを渡す
      render(
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      // Then: AuthGuardに正しくプロパティが渡される
      expect(mockAuthGuard).toHaveBeenCalledWith(
        expect.objectContaining({
          requireAdmin: true,
          children: expect.anything(),
        }),
        {}
      );
    });

    test('propsの正しい受け渡し - redirectTo', () => {
      // Given: ProtectedRouteにredirectToプロパティを渡す
      render(
        <ProtectedRoute redirectTo="/custom-login">
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Then: AuthGuardに正しくプロパティが渡される
      expect(mockAuthGuard).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectTo: '/custom-login',
          children: expect.anything(),
        }),
        {}
      );
    });

    test('propsの正しい受け渡し - fallback', () => {
      // Given: ProtectedRouteにfallbackプロパティを渡す
      const customFallback = <div>Custom Loading</div>;

      render(
        <ProtectedRoute fallback={customFallback}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Then: AuthGuardに正しくプロパティが渡される
      expect(mockAuthGuard).toHaveBeenCalledWith(
        expect.objectContaining({
          fallback: customFallback,
          children: expect.anything(),
        }),
        {}
      );
    });

    test('すべてのpropsの組み合わせ', () => {
      // Given: ProtectedRouteに複数のプロパティを渡す
      const customFallback = <div>Loading...</div>;

      render(
        <ProtectedRoute
          requireAdmin={true}
          redirectTo="/admin-login"
          fallback={customFallback}
        >
          <div>Admin Protected Content</div>
        </ProtectedRoute>
      );

      // Then: AuthGuardにすべてのプロパティが正しく渡される
      expect(mockAuthGuard).toHaveBeenCalledWith(
        expect.objectContaining({
          requireAdmin: true,
          redirectTo: '/admin-login',
          fallback: customFallback,
          children: expect.anything(),
        }),
        {}
      );
    });
  });

  describe('deprecation warning', () => {
    // Note: 実際のプロダクションコードでは非推奨警告のテストも追加できますが、
    // 今回はシンプルな実装に留めます
    test('ProtectedRouteが正常に動作する', () => {
      render(
        <ProtectedRoute>
          <div>Legacy Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Legacy Content')).toBeInTheDocument();
    });
  });
});
