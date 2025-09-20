import { NextRequest, NextResponse } from 'next/server';

// 保護されたルートのパターン
const protectedRoutes = ['/dashboard', '/admin', '/settings', '/profile'];

// 管理者専用ルートのパターン
const adminOnlyRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保護されたルートかチェック
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // 管理者専用ルートかチェック
  const isAdminRoute = adminOnlyRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Firebase Auth のセッション情報をチェック
    // Note: 実際のプロダクションでは Firebase Admin SDK を使用して
    // セッションを検証する必要があります

    // 現在は開発段階なので、基本的な認証チェックのみ実装
    // 詳細な認証・認可はクライアントサイドで行う

    // 将来的にはここで JWT トークンの検証や
    // Firebase Admin SDK を使用したセッション検証を行う

    console.log(`Protected route accessed: ${pathname}`);

    if (isAdminRoute) {
      console.log(`Admin route accessed: ${pathname}`);
    }
  }

  return NextResponse.next();
}

export const config = {
  // API ルート、静的ファイル、画像ファイルを除外
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
