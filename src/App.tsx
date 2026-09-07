import { useEffect, useState } from 'react';
import { HomeScreen } from '@/features/home/HomeScreen';
import { PracticeScreen } from '@/features/practice/PracticeScreen';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { ProfileGate } from '@/features/player/ProfileGate';
import { Gallery } from '@/design/Gallery';
import { Shell } from '@/features/shell/Shell';
import { getProfile } from '@/store/profile';
import type { PracticeMode, SetId } from '@/features/practice/useRound';
import type { ProfileRecord } from '@/store/db';

type Screen =
  | { name: 'home' }
  | { name: 'practice'; setId: SetId; practiceMode: PracticeMode }
  | { name: 'explore'; setId: SetId };
type Boot = { status: 'loading' } | { status: 'ready'; profile: ProfileRecord | null };

/**
 * Four screens and no router.
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
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    void getProfile().then((profile) => setBoot({ status: 'ready', profile: profile ?? null }));
  }, []);

  // The component gallery, in development only. import.meta.env.DEV is
  // replaced with a literal at build time, so this branch and everything under
  // it is dropped from the production bundle rather than hidden in it —
  // asserted by tools/report-bundle-size.mjs, because "should be tree-shaken"
  // is a belief until something checks.
  if (import.meta.env.DEV && window.location.hash === '#componenten') {
    return <Gallery />;
  }

  // No spinner: reading one record from IndexedDB is fast enough that a spinner
  // would flash rather than inform.
  if (boot.status === 'loading') return <div aria-busy="true" />;

  if (boot.profile === null) {
    return <ProfileGate onReady={(profile) => setBoot({ status: 'ready', profile })} />;
  }

  // Explore and practice are rounds, and a round has no navigation: no rail,
  // no bar, no tab bar, only the stop cross, the progress dots and the
  // read-aloud button. They are not wrapped in the Shell rather than having it
  // hidden inside them — there is nothing in the document to tab into, and
  // nothing that can be forgotten on the way back out.
  if (screen.name === 'explore') {
    return <ExploreScreen setId={screen.setId} onHome={() => setScreen({ name: 'home' })} />;
  }

  if (screen.name === 'practice') {
    return (
      <PracticeScreen
        key={`${screen.setId}-${screen.practiceMode}-${visit}`}
        setId={screen.setId}
        practiceMode={screen.practiceMode}
        onHome={() => setScreen({ name: 'home' })}
      />
    );
  }

  return (
    <Shell>
      <HomeScreen
        profile={boot.profile}
        onStart={(setId, practiceMode) => {
          setVisit(visit + 1);
          setScreen({ name: 'practice', setId, practiceMode });
        }}
        onExplore={(setId) => setScreen({ name: 'explore', setId })}
      />
    </Shell>
  );
}
