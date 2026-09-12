import { useEffect, useState } from 'react';
import { HomeScreen } from '@/features/home/HomeScreen';
import { SideColumn } from '@/features/home/SideColumn';
import { PracticeScreen } from '@/features/practice/PracticeScreen';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { ProfileGate } from '@/features/player/ProfileGate';
import { JijScreen } from '@/features/player/JijScreen';
import { Gallery } from '@/design/Gallery';
import { Shell } from '@/features/shell/Shell';
import { KopbalkRechts, ModuleKop } from '@/features/shell/Kopbalk';
import { MODULES, type Destination, type Module } from '@/features/shell/modules';
import { useRoute } from '@/features/shell/useRoute';
import { ModuleSoon } from '@/features/shell/ModuleSoon';
import { CategoryScreen } from '@/features/shell/CategoryScreen';
import { ModuleScreen } from '@/features/module/ModuleScreen';
import { OefenenScreen } from '@/features/oefenen/OefenenScreen';
import { VerzamelingScreen } from '@/features/verzameling/VerzamelingScreen';
import { SumScreen } from '@/features/sums/SumScreen';
import { KlokScreen } from '@/features/klok/KlokScreen';
import { VlagScreen } from '@/features/vlaggen/VlagScreen';
import { VlagExploreScreen } from '@/features/vlaggen/VlagExploreScreen';
import type { VlagMode } from '@/features/vlaggen/useVlagRound';
import { isVlagFouten, isVlagMix } from '@/content/loadVlaggen';
import {
  asKlokMode,
  asPracticeMode,
  asSumMode,
  asVlagMode,
  type Onderdeel,
} from '@/features/module/onderdelen';
import type { Route } from '@/features/shell/routes';
import { getProfile, setSticker } from '@/store/profile';
import type { ModeId } from '@/game-core';
import {
  isFoutenSet,
  isMixSet,
  type PracticeMode,
  type RoundSetId,
  type SetId,
} from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';
import type { KlokMode } from '@/features/klok/useKlokRound';
import type { ProfileRecord } from '@/store/db';

type Screen =
  | { name: 'home' }
  | {
      name: 'practice';
      setId: RoundSetId;
      practiceMode: PracticeMode;
      aantal: number | null;
      toetsstand: boolean;
    }
  | { name: 'explore'; setId: SetId }
  | {
      name: 'sums';
      setId: string;
      sumMode: SumMode;
      aantal: number | null;
      toetsstand: boolean;
    }
  | {
      name: 'klok';
      setId: string;
      klokMode: KlokMode;
      aantal: number | null;
      toetsstand: boolean;
    }
  | {
      name: 'vlag';
      setId: string;
      vlagMode: VlagMode;
      aantal: number | null;
      toetsstand: boolean;
    }
  | { name: 'vlag-ontdek'; setId: string };
type Boot = { status: 'loading' } | { status: 'ready'; profile: ProfileRecord | null };

/** Which route each of the four destinations opens. */
const BESTEMMING: Record<Destination['id'], Route> = {
  vandaag: { name: 'home' },
  oefenen: { name: 'oefenen' },
  verzameling: { name: 'verzameling' },
  jij: { name: 'you' },
};

/**
 * The screens and a router of about sixty lines.
 *
 * A module has an address, and so does each of the four destinations of the
 * rail — Vandaag, Oefenen, Verzameling, Jij — and nothing else does. Hand-rolled
 * rather than a package: the whole map is literal paths with one optional
 * segment and no nesting.
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

  const goHome = () => {
    go({ name: 'home' });
    setScreen({ name: 'home' });
  };

  const goModule = (id: Module['id']) => {
    const module = MODULES.find((candidate) => candidate.id === id);
    if (!module) return;
    setScreen({ name: 'home' });
    go(module.built ? { name: 'module', module, setId: null } : { name: 'soon', module });
  };

  const goTo = (id: Destination['id']) => {
    go(BESTEMMING[id]);
    setScreen({ name: 'home' });
  };

  const bar =
    boot.status === 'ready' && boot.profile ? (
      <KopbalkRechts profile={boot.profile} onProfiel={() => go({ name: 'you' })} />
    ) : null;

  /**
   * One way into a round, wherever in the app it is pressed.
   *
   * Exploring is the odd one: it is a way of practising as far as a child is
   * concerned and it is not a round, so it is the one mode that opens a
   * different screen.
   */
  const beginRonde = (
    deel: Onderdeel,
    mode: ModeId,
    aantal: number | null = null,
    toetsstand = false,
  ) => {
    setVisit(visit + 1);

    if (deel.moduleId === 'vlaggen') {
      if (mode === 'ontdekken' && !isVlagMix(deel.setId) && !isVlagFouten(deel.setId)) {
        setScreen({ name: 'vlag-ontdek', setId: deel.setId });
        return;
      }
      const vlagMode = asVlagMode(mode);
      setScreen({ name: 'vlag', setId: deel.setId, vlagMode, aantal, toetsstand });
      return;
    }
    if (deel.moduleId === 'klok') {
      const klokMode = asKlokMode(mode);
      setScreen({ name: 'klok', setId: deel.setId, klokMode, aantal, toetsstand });
      return;
    }
    if (deel.moduleId !== 'topo') {
      setScreen({ name: 'sums', setId: deel.setId, sumMode: asSumMode(mode), aantal, toetsstand });
      return;
    }
    // Exploring is one set's own layer, so the mix has no way of exploring and
    // does not offer one (`forms.ts`).
    if (mode === 'ontdekken' && !isMixSet(deel.setId) && !isFoutenSet(deel.setId)) {
      setScreen({ name: 'explore', setId: deel.setId as SetId });
      return;
    }
    setScreen({
      name: 'practice',
      setId: deel.setId as RoundSetId,
      practiceMode: asPracticeMode(mode),
      aantal,
      toetsstand,
    });
  };

  /**
   * The hero a child chose, written through and held here, because the
   * kopbalk shows it too: a choice that only redrew the card it was made on
   * would look like it had not been saved.
   */
  const chooseSticker = (id: string) => {
    void setSticker(id).then((updated) => {
      if (updated) setBoot({ status: 'ready', profile: updated });
    });
  };

  /**
   * A new screen starts at the top. There is no page load between screens, so
   * the browser would otherwise keep the scroll position of the one before.
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
  // asserted by tools/report-bundle-size.mjs.
  if (import.meta.env.DEV && window.location.hash === '#componenten') {
    return <Gallery />;
  }

  // No spinner: reading one record from IndexedDB is fast enough that a spinner
  // would flash rather than inform.
  if (boot.status === 'loading') return <div aria-busy="true" />;

  if (boot.profile === null) {
    return <ProfileGate onReady={(profile) => setBoot({ status: 'ready', profile })} />;
  }

  // A round has no navigation: no rail, no kopbalk, no tab bar — not hidden,
  // absent. The round screens are not wrapped in the Shell.
  if (screen.name === 'explore') {
    return <ExploreScreen setId={screen.setId} onHome={goHome} />;
  }

  if (screen.name === 'sums') {
    return (
      <SumScreen
        key={`${screen.setId}-${screen.sumMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        mode={screen.sumMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
      />
    );
  }

  if (screen.name === 'klok') {
    return (
      <KlokScreen
        key={`${screen.setId}-${screen.klokMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        mode={screen.klokMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
      />
    );
  }

  if (screen.name === 'vlag-ontdek') {
    return <VlagExploreScreen setId={screen.setId} onHome={goHome} />;
  }

  if (screen.name === 'vlag') {
    return (
      <VlagScreen
        key={`${screen.setId}-${screen.vlagMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        mode={screen.vlagMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
      />
    );
  }

  if (screen.name === 'practice') {
    return (
      <PracticeScreen
        key={`${screen.setId}-${screen.practiceMode}-${screen.aantal ?? 0}-${visit}`}
        setId={screen.setId}
        practiceMode={screen.practiceMode}
        aantal={screen.aantal}
        toetsstand={screen.toetsstand}
        onHome={goHome}
        onAgain={() => setVisit(visit + 1)}
      />
    );
  }

  const goVerzameling = () => go({ name: 'verzameling' });

  /** The child's own column, which the pages not yet rebuilt still carry. */
  const eigenKolom = (
    <SideColumn
      sticker={boot.profile.avatarConfig.sticker}
      onReis={goVerzameling}
      onBegin={beginRonde}
    />
  );

  if (route.name === 'oefenen') {
    return (
      <Shell bar={bar} current="oefenen" onNavigate={goTo}>
        <OefenenScreen onModule={goModule} />
      </Shell>
    );
  }

  if (route.name === 'verzameling') {
    return (
      <Shell bar={bar} current="verzameling" onNavigate={goTo}>
        <VerzamelingScreen sticker={boot.profile.avatarConfig.sticker} onSticker={chooseSticker} />
      </Shell>
    );
  }

  if (route.name === 'you') {
    return (
      <Shell bar={bar} current="jij" onNavigate={goTo}>
        <JijScreen profile={boot.profile} onVerzameling={goVerzameling} />
      </Shell>
    );
  }

  // A word a parent looks for, holding more than one module. Unreachable while
  // the tables are the whole of rekenen (see routes.ts).
  if (route.name === 'category') {
    return (
      <Shell bar={bar} current="oefenen" onNavigate={goTo}>
        <CategoryScreen
          category={route.category}
          onOpen={(module) => go({ name: 'module', module, setId: null })}
          aside={eigenKolom}
        />
      </Shell>
    );
  }

  // A module's address is where you choose a round in it: what, then how, then
  // a start button that says what it is starting. It belongs to Oefenen, and
  // the module stands where the logo does (S4).
  if (route.name === 'module') {
    return (
      <Shell
        bar={bar}
        current="oefenen"
        onNavigate={goTo}
        kop={<ModuleKop module={route.module} onTerug={() => goTo('oefenen')} />}
      >
        <ModuleScreen
          module={route.module}
          naam={boot.profile.naam}
          setId={route.setId}
          onSet={(setId) => go({ name: 'module', module: route.module, setId })}
          onStart={beginRonde}
          aside={eigenKolom}
        />
      </Shell>
    );
  }

  // A module the plan has and the product does not: its page says so.
  if (route.name === 'soon') {
    return (
      <Shell
        bar={bar}
        current="oefenen"
        onNavigate={goTo}
        kop={<ModuleKop module={route.module} onTerug={() => goTo('oefenen')} />}
      >
        <ModuleSoon module={route.module} onOpen={goModule} aside={eigenKolom} />
      </Shell>
    );
  }

  return (
    <Shell bar={bar} current="vandaag" onNavigate={goTo}>
      <HomeScreen
        naam={boot.profile.naam}
        sticker={boot.profile.avatarConfig.sticker}
        onReis={goVerzameling}
        onBegin={beginRonde}
        onModule={goModule}
      />
    </Shell>
  );
}
