'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block w-96 border-r bg-background">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {children}

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
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  );
}
