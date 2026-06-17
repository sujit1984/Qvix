import { QuantumFeed } from '@/components/feed/QuantumFeed';
import { TopBar } from '@/components/layout/TopBar';
import { NavBar } from '@/components/layout/NavBar';

export default function HomePage() {
  return (
    <main className="relative h-screen w-full bg-qvix-bg overflow-hidden">
      <TopBar />
      <QuantumFeed />
      <NavBar />
    </main>
  );
}
