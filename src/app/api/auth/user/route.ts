import { NextRequest } from 'next/server';
import { verifyIdToken, getFirestore } from '@/lib/firebase-admin';
import {
  createErrorResponse,
  createSuccessResponse,
  extractBearerToken,
} from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractBearerToken(authHeader || '');

    if (!token) {
      return createErrorResponse('認証が必要です', 401);
    }

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        401
      );
    }

    const firestore = getFirestore();
    const userDoc = await firestore
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) {
      return createErrorResponse('ユーザーが見つかりません', 404);
    }

    const userData = userDoc.data();

    if (!userData || !userData.name || !userData.role) {
      return createErrorResponse('ユーザーデータが不正です', 500);
    }

    return createSuccessResponse({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: userData.createdAt?.toDate()?.toISOString(),
        lastLoginAt: userData.lastLoginAt?.toDate()?.toISOString(),
        lastLogoutAt: userData.lastLogoutAt?.toDate()?.toISOString(),
        isActive: userData.isActive,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return createErrorResponse('ユーザー情報取得中にエラーが発生しました', 500);
  }
}
