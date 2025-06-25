// hooks/useAuthGuard.ts
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export function useAuthGuard() {
  const { user } = useAuth();
  const router = useRouter();

  const requireAuth = (callback: () => void) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    callback();
  };

  return { requireAuth };
}