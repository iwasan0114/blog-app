import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// AuthContext のモック
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('useAuthGuard', () => {
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

  describe('未認証ユーザー', () => {
    test('未認証時にisAuthenticatedがfalseを返す', () => {
      // Given: ユーザーが未認証
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: useAuthGuardを呼び出す
      const { result } = renderHook(() => useAuthGuard());

      // Then: 認証状態がfalse
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    test('redirectToLoginが正しく動作する', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => useAuthGuard());

      act(() => {
        result.current.redirectToLogin();
      });

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('認証済み一般ユーザー', () => {
    test('認証済み一般ユーザーの処理', () => {
      // Given: 一般ユーザーが認証済み
      const mockUser = { 
        id: '1', 
        email: 'user@example.com', 
        name: 'Test User',
        role: 'user',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: useAuthGuardを呼び出す
      const { result } = renderHook(() => useAuthGuard());

      // Then: 認証状態がtrueだが管理者権限はfalse
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('認証済み管理者', () => {
    test('管理者ユーザーの処理', () => {
      // Given: 管理者が認証済み
      const mockAdmin = { 
        id: '1', 
        email: 'admin@example.com', 
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      mockUseAuth.mockReturnValue({
        user: mockAdmin,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: useAuthGuardを呼び出す
      const { result } = renderHook(() => useAuthGuard());

      // Then: 認証状態と管理者権限がtrue
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('ローディング状態', () => {
    test('認証確認中のローディング状態', () => {
      // Given: 認証状態確認中
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // When: useAuthGuardを呼び出す
      const { result } = renderHook(() => useAuthGuard());

      // Then: ローディング状態がtrue
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });
  });
});