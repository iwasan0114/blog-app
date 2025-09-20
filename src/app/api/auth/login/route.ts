import { NextRequest } from 'next/server';
import { verifyIdToken, getFirestore } from '@/lib/firebase-admin';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequiredFields(body, ['idToken']);
    if (!validation.isValid) {
      return createErrorResponse(
        `必須フィールドが不足しています: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    const { idToken } = body;

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
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

    const currentTime = new Date();

    if (userDoc.exists) {
      const userData = userDoc.data();

      await userDoc.ref.update({
        lastLoginAt: currentTime,
      });

      return createSuccessResponse({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: userData?.email,
          name: userData?.name,
          role: userData?.role,
          createdAt: userData?.createdAt?.toDate()?.toISOString(),
          lastLoginAt: currentTime.toISOString(),
          lastLogoutAt: userData?.lastLogoutAt?.toDate()?.toISOString(),
          isActive: userData?.isActive,
        },
      });
    } else {
      const newUserData = {
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        role: 'user',
        createdAt: currentTime,
        lastLoginAt: currentTime,
        isActive: true,
      };

      await userDoc.ref.set(newUserData);

      return createSuccessResponse({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: newUserData.email,
          name: newUserData.name,
          role: newUserData.role,
          createdAt: newUserData.createdAt.toISOString(),
          lastLoginAt: newUserData.lastLoginAt.toISOString(),
          isActive: newUserData.isActive,
        },
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('ログイン処理中にエラーが発生しました', 500);
  }
}
