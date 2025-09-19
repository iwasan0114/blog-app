'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { User, AuthContext as AuthContextType } from '@/lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ユーザー情報を取得する関数
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
      // Firestoreからユーザー情報を取得（オフラインエラーの場合はスキップ）
      const userDoc = await getDoc(
        doc(firestore, 'users', firebaseUser.uid)
      );

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: userData.name || firebaseUser.displayName || 'Admin',
          role: 'admin',
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLoginAt: new Date(),
        };
      } else {
        // ユーザードキュメントが存在しない場合は Firebase Auth の情報のみで作成
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || 'Admin',
          role: 'admin',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
      }
    } catch (firestoreError) {
      // Firestoreエラー（オフラインなど）の場合は Firebase Auth の情報のみを使用
      const errorMessage = firestoreError instanceof Error ? firestoreError.message : 'Firestore接続エラー';
      console.warn('Firestore接続エラー（Firebase Authの情報のみ使用）:', errorMessage);
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || 'Admin',
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // ログイン成功時にユーザー情報を直接取得・設定
      const userData = await fetchUserData(userCredential.user);
      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false); // エラー時に先にisLoadingをfalseに
      
      let errorMessage = 'ログインに失敗しました';
      
      // Firebase Authエラーの場合のみcodeプロパティを確認
      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMessage = 'メールアドレスまたはパスワードが正しくありません';
          break;
        case 'auth/invalid-email':
          errorMessage = '有効なメールアドレスを入力してください';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'ログイン試行回数が上限に達しました。しばらく時間をおいてからお試しください';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください';
          break;
        default:
          if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            errorMessage = `ログインエラー: ${error.message}`;
          }
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null); // ログアウト時にユーザー情報をクリア
    } catch (error) {
      throw new Error('ログアウトに失敗しました');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
