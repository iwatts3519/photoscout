'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogIn } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UserMenu } from '@/components/auth/UserMenu';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useAuth } from '@/src/hooks/useAuth';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block w-96 border-r bg-background">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {children}

        {/* Desktop User Menu - Top Right */}
        <div className="hidden lg:flex absolute top-4 right-4 z-10">
          {!loading && (
            <>
              {user ? (
                <UserMenu />
              ) : (
                <Button
                  onClick={() => setIsAuthDialogOpen(true)}
                  variant="secondary"
                  className="bg-white hover:bg-gray-100 shadow-md"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button - Only visible on mobile */}
        <div className="lg:hidden absolute top-4 left-4 z-10">
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                aria-label="Open menu"
                className="bg-white hover:bg-gray-100 shadow-md"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 w-full sm:w-96">
              <SheetTitle className="sr-only">Location Details</SheetTitle>
              <SheetDescription className="sr-only">
                View and adjust location details, weather conditions, and photography scores
              </SheetDescription>

              {/* Mobile User Menu - Inside Sheet */}
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">PhotoScout</h2>
                {!loading && (
                  <>
                    {user ? (
                      <UserMenu />
                    ) : (
                      <Button
                        onClick={() => setIsAuthDialogOpen(true)}
                        size="sm"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    )}
                  </>
                )}
              </div>

              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </main>

      {/* Auth Dialog */}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </div>
  );
}
