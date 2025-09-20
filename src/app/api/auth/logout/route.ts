import { NextRequest } from 'next/server';
import { verifyIdToken, getFirestore } from '@/lib/firebase-admin';
import {
  createErrorResponse,
  createSuccessResponse,
  extractBearerToken,
} from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
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

    const currentTime = new Date();

    await userDoc.ref.update({
      lastLogoutAt: currentTime,
    });

    return createSuccessResponse({
      success: true,
      message: 'ログアウトしました',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return createErrorResponse('ログアウト処理中にエラーが発生しました', 500);
  }
}
