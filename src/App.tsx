import { useEffect, useState } from 'react';
import { HomeScreen } from '@/features/home/HomeScreen';
import { PracticeScreen } from '@/features/practice/PracticeScreen';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { ProfileGate } from '@/features/player/ProfileGate';
import { Gallery } from '@/design/Gallery';
import { Shell } from '@/features/shell/Shell';
import { RetentionScreen } from '@/features/retention/RetentionScreen';
import type { Destination } from '@/features/shell/modules';
import { useRoute } from '@/features/shell/useRoute';
import { ModuleSoon } from '@/features/shell/ModuleSoon';
import type { Route } from '@/features/shell/routes';
import { getProfile } from '@/store/profile';
import type { PracticeMode, SetId } from '@/features/practice/useRound';
import type { ProfileRecord } from '@/store/db';

type Screen =
  | { name: 'home' }
  | { name: 'retention' }
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
  const [route, go] = useRoute();

  // The tab bar's four destinations, two of which exist. Mapping them here
  // rather than inside the Shell keeps the frame ignorant of what a screen is.
  const goTo = (id: Destination['id']) => {
    const next: Route = id === 'onthouden' ? { name: 'retention' } : { name: 'home' };
    go(next);
    setScreen(next.name === 'retention' ? { name: 'retention' } : { name: 'home' });
  };

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

  // A module the plan has and the product does not. Reached only by typing the
  // address: ADR-037 keeps it out of the rail, because a rail entry is an offer
  // and this is an answer to a question the child asked.
  if (route.name === 'soon') {
    return (
      <Shell onNavigate={goTo}>
        <ModuleSoon module={route.module} onHome={() => go({ name: 'home' })} />
      </Shell>
    );
  }

  if (route.name === 'retention' || screen.name === 'retention') {
    return (
      <Shell current="onthouden" onNavigate={goTo}>
        <RetentionScreen />
      </Shell>
    );
  }

  return (
    <Shell current="vandaag" onNavigate={goTo}>
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
