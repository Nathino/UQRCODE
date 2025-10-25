import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoginForm } from './components/auth/LoginForm';
import { QRGenerator } from './components/qr/QRGenerator';
import { LoadingSpinner } from './components/ui/loading';
import { AuthLayout } from './components/layout/AuthLayout';
import { SplashScreen } from './components/ui/SplashScreen';

export default function App() {
  const { user, loading } = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <>
        <SplashScreen />
        <LoginForm />
      </>
    );
  }

  return (
    <AuthLayout onSignOut={handleSignOut}>
      <QRGenerator />
    </AuthLayout>
  );
}