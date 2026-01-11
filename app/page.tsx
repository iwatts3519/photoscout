import { AppShell } from '@/components/layout/AppShell';
import { MapView } from '@/components/map/MapView';

export default function HomePage() {
  return (
    <AppShell>
      <MapView />
    </AppShell>
  );
}
