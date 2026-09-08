import { useEffect, useState } from 'react';
import { HomeScreen } from '@/features/home/HomeScreen';
import { PracticeScreen } from '@/features/practice/PracticeScreen';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { ProfileGate } from '@/features/player/ProfileGate';
import { Gallery } from '@/design/Gallery';
import { Shell } from '@/features/shell/Shell';
import { TopBar } from '@/features/shell/TopBar';
import { RetentionScreen } from '@/features/retention/RetentionScreen';
import { MODULES, type Destination, type Module } from '@/features/shell/modules';
import { useRoute } from '@/features/shell/useRoute';
import { ModuleSoon } from '@/features/shell/ModuleSoon';
import { CategoryScreen } from '@/features/shell/CategoryScreen';
import { ChooseRoundScreen } from '@/features/round/ChooseRoundScreen';
import { ChooseTableScreen } from '@/features/sums/ChooseTableScreen';
import { SumScreen } from '@/features/sums/SumScreen';
import { ProfileScreen } from '@/features/player/ProfileScreen';
import type { Route } from '@/features/shell/routes';
import { getProfile } from '@/store/profile';
import type { PracticeMode, SetId } from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';
import type { ProfileRecord } from '@/store/db';

type Screen =
  | { name: 'home' }
  | { name: 'retention' }
  | { name: 'practice'; setId: SetId; practiceMode: PracticeMode }
  | { name: 'explore'; setId: SetId }
  | { name: 'sums'; setId: string; sumMode: SumMode };
type Boot = { status: 'loading' } | { status: 'ready'; profile: ProfileRecord | null };

/**
 * Seven screens and a router of about sixty lines.
 *
 * This comment used to say a router would be furniture until there was more
 * than one module. There still is one; the reason changed. A module has an
 * address now, and §A's "leer.nu/topografie" only reads as a sentence if the
 * path is real. Hand-rolled rather than a package: the whole map is literal
 * paths with no parameters and no nesting.
 *
 * A round has no address, on purpose. It is something you are in the middle of,
 * and a URL that resumed one halfway would either lie about the progress or
 * throw it away — which is why the round screens are chosen by `screen` and
 * everything else by `route`.
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
  const goHome = () => {
    go({ name: 'home' });
    setScreen({ name: 'home' });
  };

  const goModule = (id: Module['id']) => {
    const module = MODULES.find((candidate) => candidate.id === id);
    if (!module) return;
    setScreen({ name: 'home' });
    go(module.built ? { name: 'module', module } : { name: 'soon', module });
  };

  const bar =
    boot.status === 'ready' && boot.profile ? (
      <TopBar profile={boot.profile} onProfile={() => go({ name: 'you' })} />
    ) : null;

  const goTo = (id: Destination['id']) => {
    const next: Route =
      id === 'onthouden'
        ? { name: 'retention' }
        : id === 'jij'
          ? { name: 'you' }
          : { name: 'home' };
    go(next);
    setScreen({ name: 'home' });
  };

  /**
   * A new screen starts at the top.
   *
   * There is no page load between screens — the router swaps a component — so
   * the browser keeps the scroll position of the one before. On a phone that
   * meant arriving at the chooser already scrolled past its own heading, with
   * the wordmark cut in half, because the button that opens it sits below the
   * fold on the screen you press it from.
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name, route.name]);

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
    return <ExploreScreen setId={screen.setId} onHome={goHome} />;
  }

  if (screen.name === 'sums') {
    return (
      <SumScreen
        key={`${screen.setId}-${screen.sumMode}-${visit}`}
        setId={screen.setId}
        mode={screen.sumMode}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
      />
    );
  }

  if (screen.name === 'practice') {
    return (
      <PracticeScreen
        key={`${screen.setId}-${screen.practiceMode}-${visit}`}
        setId={screen.setId}
        practiceMode={screen.practiceMode}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
      />
    );
  }

  // The word a parent types. Tafels sits under rekenen; klokkijken does not,
  // because telling the time is reading an instrument rather than arithmetic.
  if (route.name === 'category') {
    return (
      <Shell bar={bar} onNavigate={goTo} onModule={goModule}>
        <CategoryScreen
          category={route.category}
          onOpen={(module) => go({ name: 'module', module })}
          onHome={() => go({ name: 'home' })}
        />
      </Shell>
    );
  }

  // A module the plan has and the product does not. Reached only by typing the
  // address: ADR-037 keeps it out of the rail, because a rail entry is an offer
  // and this is an answer to a question the child asked.
  // A module's address is where you choose a round in it. Two numbered steps,
  // what and then how (K2), which is also why /topografie is not the home
  // screen: the front door is every module, this is one of them.
  if (route.name === 'module') {
    // Each module chooses its own round. They share the two numbered steps and
    // nothing else: a table is not a set of places and the ways of answering
    // one are not the ways of answering the other.
    return (
      <Shell bar={bar} onNavigate={goTo} onModule={goModule} currentModule={route.module.id}>
        {route.module.id === 'tafels' ? (
          <ChooseTableScreen
            onStart={(setId, sumMode) => {
              setVisit(visit + 1);
              setScreen({ name: 'sums', setId, sumMode });
            }}
          />
        ) : (
          <ChooseRoundScreen
            onStart={(setId, practiceMode) => {
              setVisit(visit + 1);
              setScreen({ name: 'practice', setId, practiceMode });
            }}
            onExplore={(setId) => setScreen({ name: 'explore', setId })}
          />
        )}
      </Shell>
    );
  }

  if (route.name === 'soon') {
    return (
      <Shell bar={bar} onNavigate={goTo} onModule={goModule} currentModule={route.module.id}>
        <ModuleSoon module={route.module} onHome={() => go({ name: 'home' })} />
      </Shell>
    );
  }

  if (route.name === 'you') {
    return (
      <Shell bar={bar} current="jij" onNavigate={goTo} onModule={goModule}>
        <ProfileScreen profile={boot.profile} />
      </Shell>
    );
  }

  if (route.name === 'retention' || screen.name === 'retention') {
    return (
      <Shell bar={bar} current="onthouden" onNavigate={goTo} onModule={goModule}>
        <RetentionScreen />
      </Shell>
    );
  }

  return (
    <Shell bar={bar} current="vandaag" onNavigate={goTo} onModule={goModule}>
      <HomeScreen
        onStart={(setId, practiceMode) => {
          setVisit(visit + 1);
          setScreen({ name: 'practice', setId, practiceMode });
        }}
        onStartSum={(setId) => {
          setVisit(visit + 1);
          setScreen({ name: 'sums', setId, sumMode: 'som-typen' });
        }}
        onChoose={goModule}
        onModule={goModule}
      />
    </Shell>
  );
}
