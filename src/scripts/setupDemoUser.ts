// Firebase Admin SDKを使用してデモユーザーを作成するスクリプト
// 実際の運用では、Firebase Consoleまたは適切な管理ツールを使用してください

import { initializeFirebaseAdmin, getFirestore } from '../lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const DEMO_USER = {
  email: 'admin@example.com',
  password: 'password123',
  name: 'Demo Admin',
  role: 'admin' as const,
};

export async function createDemoUser() {
  try {
    // Firebase Admin SDKを初期化
    initializeFirebaseAdmin();

    const adminAuth = getAuth();
    const adminFirestore = getFirestore();

    // 1. Firebase Authenticationにユーザーを作成
    const userRecord = await adminAuth.createUser({
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      displayName: DEMO_USER.name,
    });

    console.log('Firebase Auth ユーザーが作成されました:', userRecord.uid);

    // 2. Firestoreにユーザー情報を保存
    await adminFirestore.collection('users').doc(userRecord.uid).set({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });

    console.log('Firestore ユーザードキュメントが作成されました');
    console.log(`デモユーザーの準備が完了しました:
      Email: ${DEMO_USER.email}
      Password: ${DEMO_USER.password}
      UID: ${userRecord.uid}
    `);

    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('ユーザーは既に存在します:', DEMO_USER.email);
      return null;
    }

    console.error('デモユーザー作成エラー:', error);
    throw error;
  }
}

// 実行用関数（開発環境でのみ使用）
if (process.env.NODE_ENV === 'development') {
  createDemoUser().catch(console.error);
}
