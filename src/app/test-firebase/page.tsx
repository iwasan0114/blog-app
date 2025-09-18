'use client';

import { useEffect, useState } from 'react';
import { auth, firestore, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

export default function TestFirebasePage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const updateResult = (
    name: string,
    status: 'success' | 'error' | 'pending',
    message: string
  ) => {
    setTestResults(prev => {
      const filtered = prev.filter(r => r.name !== name);
      return [...filtered, { name, status, message }];
    });
  };

  const testFirebaseConnection = async () => {
    setLoading(true);
    setTestResults([]);

    // エミュレータに接続（開発環境の場合）
    if (process.env.NODE_ENV === 'development') {
      try {
        if (!auth.emulatorConfig) {
          connectAuthEmulator(auth, 'http://localhost:9099');
        }
        if (
          !(firestore as any)._delegate._databaseId.host.includes('localhost')
        ) {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        }
        if (!(storage as any)._delegate._host.includes('localhost')) {
          connectStorageEmulator(storage, 'localhost', 9199);
        }
      } catch (error) {
        console.log('エミュレータ接続スキップ（既に接続済みまたは本番環境）');
      }
    }

    // 1. Firebase Auth テスト
    updateResult('auth', 'pending', 'Firebase Authを確認中...');
    try {
      // Auth の初期化確認
      const currentUser = auth.currentUser;
      updateResult(
        'auth',
        'success',
        `Firebase Auth 初期化成功 (ユーザー: ${currentUser ? 'ログイン済み' : '未ログイン'})`
      );
    } catch (error) {
      updateResult('auth', 'error', `Firebase Auth エラー: ${error}`);
    }

    // 2. Firestore テスト
    updateResult('firestore', 'pending', 'Firestoreを確認中...');
    try {
      const testCollection = collection(firestore, 'test');

      // テストドキュメントを作成
      const docRef = await addDoc(testCollection, {
        message: 'Firebase接続テスト',
        timestamp: new Date(),
      });

      // ドキュメントを読み取り
      const snapshot = await getDocs(testCollection);
      const docCount = snapshot.size;

      updateResult(
        'firestore',
        'success',
        `Firestore 接続成功 (ドキュメント数: ${docCount}, 最新ID: ${docRef.id})`
      );
    } catch (error) {
      updateResult('firestore', 'error', `Firestore エラー: ${error}`);
    }

    // 3. Storage テスト
    updateResult('storage', 'pending', 'Firebase Storageを確認中...');
    try {
      // テスト用のダミーパスでStorageの初期化確認
      const testRef = ref(storage, 'test/dummy.txt');

      // ストレージの初期化確認（実際のファイルがなくてもrefは作成できる）
      updateResult(
        'storage',
        'success',
        `Firebase Storage 初期化成功 (バケット: ${storage.app.options.storageBucket})`
      );
    } catch (error) {
      updateResult('storage', 'error', `Firebase Storage エラー: ${error}`);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '🔄';
      default:
        return '⚪';
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Firebase 接続テスト</h1>

      <div className="mb-8">
        <button
          onClick={testFirebaseConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'テスト実行中...' : 'Firebase接続テストを実行'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">テスト結果</h2>
          {testResults.map(result => (
            <div
              key={result.name}
              className="border rounded-lg p-4 flex items-start space-x-3"
            >
              <span className="text-2xl">{getStatusIcon(result.status)}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg capitalize">
                  {result.name}
                </h3>
                <p className={getStatusColor(result.status)}>
                  {result.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">環境変数チェック</h3>
        <ul className="space-y-1 text-sm">
          <li>
            API Key:{' '}
            {process.env.NEXT_PUBLIC_FIREBASE_API_KEY
              ? '✅ 設定済み'
              : '❌ 未設定'}
          </li>
          <li>
            Auth Domain:{' '}
            {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
              ? '✅ 設定済み'
              : '❌ 未設定'}
          </li>
          <li>
            Project ID:{' '}
            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
              ? '✅ 設定済み'
              : '❌ 未設定'}
          </li>
          <li>
            Storage Bucket:{' '}
            {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
              ? '✅ 設定済み'
              : '❌ 未設定'}
          </li>
        </ul>
      </div>
    </div>
  );
}
