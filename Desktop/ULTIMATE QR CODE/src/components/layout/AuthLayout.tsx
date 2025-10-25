import { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowRight } from 'lucide-react';

interface AuthLayoutProps extends PropsWithChildren {
  onSignOut: () => void;
}

export function AuthLayout({ children, onSignOut }: AuthLayoutProps) {
  return (
    <div className="relative">
      <Button
        onClick={onSignOut}
        className="absolute top-6 right-2 sm:top-4 sm:right-4 bg-white/20 hover:bg-white/30 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 z-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Sign Out</span>
        <ArrowRight className="w-4 h-4 sm:hidden" />
      </Button>
      {children}
    </div>
  );
}