import { NextRequest } from 'next/server';
import { verifyIdToken, getFirestore } from '@/lib/firebase-admin';
import {
  createErrorResponse,
  createSuccessResponse,
  extractBearerToken,
} from '@/lib/auth-utils';
import { validateBlogListQuery, calculatePagination } from '@/lib/blog-utils';
import { BlogListQuery } from '@/lib/types/blog';

export async function GET(request: NextRequest) {
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

    // クエリパラメータの取得とバリデーション
    const url = new URL(request.url);
    const query: BlogListQuery = {
      page: url.searchParams.get('page')
        ? parseInt(url.searchParams.get('page')!)
        : 1,
      limit: url.searchParams.get('limit')
        ? parseInt(url.searchParams.get('limit')!)
        : 10,
      search: url.searchParams.get('search') || undefined,
      status: (url.searchParams.get('status') as any) || undefined,
      authorId: url.searchParams.get('authorId') || undefined,
    };

    const validation = validateBlogListQuery(query);
    if (!validation.isValid) {
      return createErrorResponse(
        `無効なパラメータ: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    // Firestoreからブログデータを取得
    const firestore = getFirestore();
    let blogsQuery = firestore.collection('blogs').orderBy('createdAt', 'desc');

    // フィルタ条件の適用
    if (query.status) {
      blogsQuery = blogsQuery.where('status', '==', query.status);
    }

    if (query.authorId) {
      blogsQuery = blogsQuery.where('authorId', '==', query.authorId);
    }

    // ページネーション
    const offset = (query.page! - 1) * query.limit!;
    blogsQuery = blogsQuery.limit(query.limit!).offset(offset);

    const snapshot = await blogsQuery.get();

    // 検索フィルタ（Firestoreではフルテキスト検索が制限されるため、クライアントサイドで実装）
    let blogs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    if (query.search) {
      blogs = blogs.filter(blog => {
        const title = ((blog as any).title as string) || '';
        const content = ((blog as any).content as string) || '';
        return (
          title.toLowerCase().includes(query.search!.toLowerCase()) ||
          content.toLowerCase().includes(query.search!.toLowerCase())
        );
      });
    }

    // 総数取得（簡易実装）
    const totalSnapshot = await firestore.collection('blogs').get();
    const total = totalSnapshot.size;

    // ページネーション情報計算
    const pagination = calculatePagination(query.page!, query.limit!, total);

    return createSuccessResponse({
      success: true,
      blogs,
      pagination,
    });
  } catch (error) {
    console.error('Blog list error:', error);
    return createErrorResponse('ブログ一覧取得中にエラーが発生しました', 500);
  }
}

export async function POST(request: NextRequest) {
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
    const { validateCreateBlogRequest, sanitizeText } = await import(
      '@/lib/blog-utils'
    );
    const validation = validateCreateBlogRequest(requestData);
    if (!validation.isValid) {
      return createErrorResponse(
        `無効なパラメータ: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    // Firestoreにブログを保存
    const firestore = getFirestore();
    const now = new Date();

    const blogData = {
      title: sanitizeText(requestData.title),
      content: sanitizeText(requestData.content),
      status: requestData.status,
      imageUrl: requestData.imageUrl || null,
      authorId: decodedToken.uid,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await firestore.collection('blogs').add(blogData);

    const createdBlog = {
      id: docRef.id,
      ...blogData,
    };

    return createSuccessResponse(
      {
        success: true,
        blog: createdBlog,
      },
      201
    );
  } catch (error) {
    console.error('Blog create error:', error);
    return createErrorResponse('ブログ作成中にエラーが発生しました', 500);
  }
}
