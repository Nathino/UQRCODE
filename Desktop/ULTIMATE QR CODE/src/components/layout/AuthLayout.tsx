import { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowRight, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/adminUtils';

interface AuthLayoutProps extends PropsWithChildren {
  onSignOut: () => void;
  onProfileClick?: () => void;
  onAdminClick?: () => void;
}

export function AuthLayout({ children, onSignOut, onProfileClick, onAdminClick }: AuthLayoutProps) {
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user?.email || null);

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 sm:top-4 sm:right-6 flex items-center space-x-2 z-50">
        {onProfileClick && (
          <Button
            onClick={onProfileClick}
            className="bg-white/20 hover:bg-white/30 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30"
            title="View Profile"
          >
            <User className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        )}
        {userIsAdmin && onAdminClick && (
          <Button
            onClick={onAdminClick}
            className="bg-purple-500/30 hover:bg-purple-500/40 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/40"
            title="Admin Dashboard"
          >
            <Shield className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        )}
        <Button
          onClick={onSignOut}
          className="bg-white/20 hover:bg-white/30 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Sign Out</span>
          <ArrowRight className="w-4 h-4 sm:hidden" />
        </Button>
      </div>
      {children}
    </div>
  );
}