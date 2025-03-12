import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to avoid hydration issues
const MainLayout = dynamic(() => import('../components/MainLayout').then(mod => ({ default: mod.MainLayout })), {
  ssr: false
});

export default function Home() {
  return <MainLayout />;
} 