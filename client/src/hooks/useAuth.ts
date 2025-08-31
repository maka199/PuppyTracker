import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { username, isAuthenticated } = useAuthContext();

  // Create a user object that matches the expected format for backwards compatibility
  const user = username ? {
    id: username,
    firstName: username,
    lastName: '',
    email: `${username}@local`,
    username: username
  } : null;

  return {
    user,
    isLoading: false, // No loading since we're using localStorage
    isAuthenticated,
  };
}
