import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// AuthContextからのuseAuthをre-exportして、フックとしても使用可能にする
export const useAuth = useAuthContext;
