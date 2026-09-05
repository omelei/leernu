import { useEffect, useState } from 'react';
import { HomeScreen } from '@/features/player/HomeScreen';
import { ProfileGate } from '@/features/player/ProfileGate';
import { getProfile } from '@/store/profile';
import type { ProfileRecord } from '@/store/db';

type LoadState = { status: 'loading' } | { status: 'ready'; profile: ProfileRecord | null };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    void getProfile().then((profile) => {
      setState({ status: 'ready', profile: profile ?? null });
    });
  }, []);

  // No spinner: reading one record from IndexedDB is fast enough that a spinner
  // would flash rather than inform. An empty frame for a few milliseconds is
  // calmer than a loading animation nobody can read.
  if (state.status === 'loading') {
    return <div aria-busy="true" />;
  }

  if (state.profile === null) {
    return <ProfileGate onReady={(profile) => setState({ status: 'ready', profile })} />;
  }

  return <HomeScreen profile={state.profile} />;
}
