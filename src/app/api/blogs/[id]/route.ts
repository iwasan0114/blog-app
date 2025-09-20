import { NextRequest } from 'next/server';
import { verifyIdToken, getFirestore } from '@/lib/firebase-admin';
import {
  createErrorResponse,
  createSuccessResponse,
  extractBearerToken,
} from '@/lib/auth-utils';
import {
  validateUpdateBlogRequest,
  sanitizeText,
  canAccessBlog,
  canEditBlog,
} from '@/lib/blog-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
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

    // Firestoreからブログを取得
    const firestore = getFirestore();
    const blogDoc = await firestore.collection('blogs').doc(params.id).get();

    if (!blogDoc.exists) {
      return createErrorResponse('ブログが見つかりません', 404);
    }

    const blogData = blogDoc.data();
    if (!blogData) {
      return createErrorResponse('ブログが見つかりません', 404);
    }

    const blog = {
      id: blogDoc.id,
      ...blogData,
      createdAt: blogData.createdAt?.toDate() || new Date(),
      updatedAt: blogData.updatedAt?.toDate() || new Date(),
    };

    // アクセス権限チェック
    const user = { id: decodedToken.uid, role: 'user' };
    if (
      !canAccessBlog(
        { status: blogData.status, authorId: blogData.authorId },
        user
      )
    ) {
      return createErrorResponse(
        'このブログにアクセスする権限がありません',
        403
      );
    }

    return createSuccessResponse({
      success: true,
      blog,
    });
  } catch (error) {
    console.error('Blog detail error:', error);
    return createErrorResponse('ブログ詳細取得中にエラーが発生しました', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
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

    // リクエストボディの解析
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return createErrorResponse('リクエストデータが無効です', 400);
    }

    // バリデーション
    const validation = validateUpdateBlogRequest(requestData);
    if (!validation.isValid) {
      return createErrorResponse(
        `無効なパラメータ: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    // 既存ブログの取得と権限チェック
    const firestore = getFirestore();
    const blogDoc = await firestore.collection('blogs').doc(params.id).get();

    if (!blogDoc.exists) {
      return createErrorResponse('ブログが見つかりません', 404);
    }

    const existingBlog = blogDoc.data();
    const user = { id: decodedToken.uid, role: 'user' };

    if (
      !existingBlog ||
      !canEditBlog({ authorId: existingBlog.authorId }, user)
    ) {
      return createErrorResponse('このブログを編集する権限がありません', 403);
    }

    // 更新データの準備
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (requestData.title !== undefined) {
      updateData.title = sanitizeText(requestData.title);
    }
    if (requestData.content !== undefined) {
      updateData.content = sanitizeText(requestData.content);
    }
    if (requestData.status !== undefined) {
      updateData.status = requestData.status;
    }
    if (requestData.imageUrl !== undefined) {
      updateData.imageUrl = requestData.imageUrl;
    }

    // Firestoreでブログを更新
    await firestore.collection('blogs').doc(params.id).update(updateData);

    // 更新後のブログを取得
    const updatedDoc = await firestore.collection('blogs').doc(params.id).get();
    const updatedBlogData = updatedDoc.data();
    const updatedBlog = {
      id: updatedDoc.id,
      ...updatedBlogData,
      createdAt: updatedBlogData?.createdAt?.toDate() || new Date(),
      updatedAt: updatedBlogData?.updatedAt?.toDate() || new Date(),
    };

    return createSuccessResponse({
      success: true,
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Blog update error:', error);
    return createErrorResponse('ブログ更新中にエラーが発生しました', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
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

    // 既存ブログの取得と権限チェック
    const firestore = getFirestore();
    const blogDoc = await firestore.collection('blogs').doc(params.id).get();

    if (!blogDoc.exists) {
      return createErrorResponse('ブログが見つかりません', 404);
    }

    const existingBlog = blogDoc.data();
    const user = { id: decodedToken.uid, role: 'user' };

    if (
      !existingBlog ||
      !canEditBlog({ authorId: existingBlog.authorId }, user)
    ) {
      return createErrorResponse('このブログを削除する権限がありません', 403);
    }

    // Firestoreからブログを削除
    await firestore.collection('blogs').doc(params.id).delete();

    return createSuccessResponse({
      success: true,
      message: 'ブログが正常に削除されました',
    });
  } catch (error) {
    console.error('Blog delete error:', error);
    return createErrorResponse('ブログ削除中にエラーが発生しました', 500);
  }
}
