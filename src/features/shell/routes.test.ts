import { describe, expect, it } from 'vitest';
import { MODULE_SLUG, pathFor, routeFor, RETENTION_SLUG } from './routes';
import { MODULES } from './modules';

/**
 * The addresses.
 *
 * Two things are being pinned. That every module in the plan has a path, so
 * adding the eighth cannot quietly leave it unreachable — and that a path a
 * child mistypes lands them somewhere they can carry on from rather than on an
 * error about their spelling.
 */
describe('the addresses', () => {
  it('opens the front door at the root', () => {
    expect(routeFor('/')).toEqual({ name: 'home' });
    expect(routeFor('')).toEqual({ name: 'home' });
  });

  it('gives every module in the plan a path of its own', () => {
    const slugs = MODULES.map((module) => MODULE_SLUG[module.id]);
    expect(new Set(slugs).size, 'two modules share a slug').toBe(slugs.length);

    for (const module of MODULES) {
      const route = routeFor(`/${MODULE_SLUG[module.id]}`);
      expect(route.name, module.id).toBe(module.built ? 'module' : 'soon');
    }
  });

  it('opens topography, which is the one that exists', () => {
    const route = routeFor('/topografie');
    expect(route).toMatchObject({ name: 'module' });
  });

  it('says "not yet" for a module the plan has and the product does not', () => {
    // Not a redirect to the home screen. The child asked a question by typing
    // an address, and showing them something else instead of answering is how
    // an app teaches you not to trust its addresses.
    const route = routeFor('/klokkijken');
    expect(route).toMatchObject({ name: 'soon' });
  });

  it('sends a mistyped path to the front door rather than an error', () => {
    expect(routeFor('/topgrafie')).toEqual({ name: 'home' });
    expect(routeFor('/wat-dan-ook')).toEqual({ name: 'home' });
  });

  it('ignores the slashes people actually type', () => {
    expect(routeFor('/topografie/')).toMatchObject({ name: 'module' });
    expect(routeFor('topografie')).toMatchObject({ name: 'module' });
  });

  it('round-trips every route through its own path', () => {
    expect(routeFor(pathFor({ name: 'home' }))).toEqual({ name: 'home' });
    expect(routeFor(pathFor({ name: 'retention' }))).toEqual({ name: 'retention' });

    for (const module of MODULES) {
      const route = module.built
        ? ({ name: 'module', module } as const)
        : ({ name: 'soon', module } as const);
      expect(routeFor(pathFor(route)), module.id).toMatchObject({ name: route.name });
    }
  });

  it('keeps the retention screen at a word a child could type', () => {
    expect(RETENTION_SLUG).toBe('onthouden');
    expect(routeFor('/onthouden')).toEqual({ name: 'retention' });
  });
});
