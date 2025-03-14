import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to avoid hydration issues
const App = dynamic(() => import('../App').then(mod => ({ default: mod.default })), {
  ssr: false
});

export default function Home() {
  return <App />;
} 