/**
 * アプリケーション設定
 */
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  features: {
    blogPreview: boolean;
    memberImport: boolean;
    auditLog: boolean;
  };
  limits: {
    blogTitleMaxLength: number;
    blogContentMaxLength: number;
    memberNameMaxLength: number;
    memberDescriptionMaxLength: number;
    maxFileSize: number;
    allowedImageTypes: string[];
  };
}
