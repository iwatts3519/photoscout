import { Suspense } from 'react';
import { SharePageContent } from './SharePageContent';
import { Loader2 } from 'lucide-react';

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SharePageContent />
    </Suspense>
  );
}
