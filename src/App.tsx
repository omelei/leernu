import { useEffect, useState } from 'react';
import { HomeScreen } from '@/features/home/HomeScreen';
import { PracticeScreen } from '@/features/practice/PracticeScreen';
import { ProfileGate } from '@/features/player/ProfileGate';
import { getProfile } from '@/store/profile';
import type { ProfileRecord } from '@/store/db';

type Screen = 'home' | 'practice';
type Boot = { status: 'loading' } | { status: 'ready'; profile: ProfileRecord | null };

/**
 * Three screens and no router.
 *
 * A router would be a dependency and a bundle cost for a product whose entire
 * navigation is "start a round, finish it, come back". When there are more
 * modules than one it earns its place; today it would be furniture.
 *
 * The practice screen is keyed on each visit so a second round starts genuinely
 * fresh rather than reusing the first round's state.
 */
export default function App() {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' });
  const [screen, setScreen] = useState<Screen>('home');
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    void getProfile().then((profile) => setBoot({ status: 'ready', profile: profile ?? null }));
  }, []);

  // No spinner: reading one record from IndexedDB is fast enough that a spinner
  // would flash rather than inform.
  if (boot.status === 'loading') return <div aria-busy="true" />;

  if (boot.profile === null) {
    return <ProfileGate onReady={(profile) => setBoot({ status: 'ready', profile })} />;
  }

  if (screen === 'practice') {
    return (
      <PracticeScreen
        key={visit}
        onHome={() => {
          setScreen('home');
        }}
      />
    );
  }

  return (
    <HomeScreen
      profile={boot.profile}
      onStart={() => {
        setVisit(visit + 1);
        setScreen('practice');
      }}
    />
  );
}
