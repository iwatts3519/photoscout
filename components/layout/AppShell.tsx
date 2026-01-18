'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogIn, HelpCircle, Keyboard } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UserMenu } from '@/components/auth/UserMenu';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { OnboardingDialog } from '@/components/onboarding/OnboardingDialog';
import { KeyboardShortcutsDialog } from '@/components/shared/KeyboardShortcuts';
import { useAuth } from '@/src/hooks/useAuth';
import { useRecentSearches } from '@/src/hooks/useRecentSearches';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useMapStore } from '@/src/stores/mapStore';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import {
  useKeyboardShortcuts,
  createAppShortcuts,
} from '@/src/hooks/useKeyboardShortcuts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, loading } = useAuth();

  // Onboarding state
  const {
    hasCompletedOnboarding,
    showOnboarding,
    startOnboarding,
    setShowOnboarding,
  } = useOnboardingStore();

  // Map state for keyboard shortcuts
  const mapInstance = useMapStore((state) => state.mapInstance);
  const { getLocation } = useGeolocation();

  // Sync recent searches with localStorage
  useRecentSearches();

  // Auto-show onboarding for new users (only on client side after hydration)
  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding && !showOnboarding) {
        startOnboarding();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding, showOnboarding, startOnboarding]);

  // Keyboard shortcut handlers
  const handleFocusSearch = useCallback(() => {
    // Find the search input in the DOM
    const searchInput = document.querySelector(
      '[data-search-input]'
    ) as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  }, [mapInstance]);

  const handleLocateMe = useCallback(() => {
    getLocation();
  }, [getLocation]);

  // Register keyboard shortcuts
  const shortcuts = createAppShortcuts({
    onFocusSearch: handleFocusSearch,
    onOpenSettings: () => setIsSettingsOpen(true),
    onShowHelp: () => startOnboarding(),
    onShowKeyboardShortcuts: () => setIsShortcutsDialogOpen(true),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onLocateMe: handleLocateMe,
  });

  useKeyboardShortcuts({
    shortcuts,
    enabled: !showOnboarding && !isAuthDialogOpen && !isShortcutsDialogOpen,
  });

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
        <div className="hidden lg:flex absolute top-4 right-4 z-10 gap-2">
          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white hover:bg-gray-100 shadow-md"
                aria-label="Help and shortcuts"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => startOnboarding()}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Getting Started
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsShortcutsDialogOpen(true)}>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard Shortcuts
                <span className="ml-auto text-xs text-muted-foreground">?</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!loading && (
            <>
              {user ? (
                <UserMenu />
              ) : (
                <>
                  <SettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                  />
                  <Button
                    onClick={() => setIsAuthDialogOpen(true)}
                    variant="secondary"
                    className="bg-white hover:bg-gray-100 shadow-md"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </>
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
                <div className="flex items-center gap-2">
                  {/* Help Menu for Mobile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Help and shortcuts"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startOnboarding()}>
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Getting Started
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsShortcutsDialogOpen(true)}>
                        <Keyboard className="mr-2 h-4 w-4" />
                        Keyboard Shortcuts
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {!loading && (
                    <>
                      {user ? (
                        <UserMenu />
                      ) : (
                        <>
                          <SettingsDialog
                            open={isSettingsOpen}
                            onOpenChange={setIsSettingsOpen}
                          />
                          <Button
                            onClick={() => setIsAuthDialogOpen(true)}
                            size="sm"
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </main>

      {/* Auth Dialog */}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />

      {/* Onboarding Dialog */}
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={isShortcutsDialogOpen}
        onOpenChange={setIsShortcutsDialogOpen}
      />
    </div>
  );
}
