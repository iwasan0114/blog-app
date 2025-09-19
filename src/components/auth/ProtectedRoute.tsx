'use client';

import React from 'react';
import { AuthGuard, AuthGuardProps } from './AuthGuard';

interface ProtectedRouteProps extends Omit<AuthGuardProps, 'children'> {
  children: React.ReactNode;
}

/**
 * @deprecated Use AuthGuard instead for better flexibility and features
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  ...authGuardProps 
}) => {
  return (
    <AuthGuard {...authGuardProps}>
      {children}
    </AuthGuard>
  );
};
