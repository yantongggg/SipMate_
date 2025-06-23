import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export function useAuthGuard() {
  const { user } = useAuth();

  const requireAuth = (action: () => void) => {
    if (!user) {
      router.push('/auth');
      return false;
    }
    action();
    return true;
  };

  return { requireAuth, isAuthenticated: !!user };
}