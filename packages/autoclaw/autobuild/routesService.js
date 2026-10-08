// ZIPPY OPEN MATERIAL
//
// Autopilot routing service: the wiring between the pure resolution ladder
// (modelRoutes.ts), the user's settings, provider discovery, and the optional
// premium/ZMLR resolvers. The public side owns CANDIDATE DISCOVERY (what
// providers/models the user actually has); the premium engine only ranks the
// candidates it is given. Everything here is dependency-injected so unit tests
// run without vscode, network, or the private package.
export { isLocalProvider as isLocalProvider };
export { candidatesFromConfig as candidatesFromConfig };
export { ollamaCandidates as ollamaCandidates };
export { mergeCandidates as mergeCandidates };
export { premiumDelegate as premiumDelegate };
export { zmlrDelegate as zmlrDelegate };
export { buildRoutingContext as buildRoutingContext };
export { resolveAllModelRoutes as resolveAllModelRoutes };
import * as modelRoutes_1 from './modelRoutes.js';
/** Providers treated as local capacity when building candidates. */
const LOCAL_PROVIDERS = new Set(['ollama', 'lmstudio', 'llamacpp']);
/** True for locally-hosted providers — nothing leaves the machine. */
function isLocalProvider(provider) {
    return LOCAL_PROVIDERS.has(provider);
}
/**
 * Candidates implied by the user's own tier table + fallback (deduped).
 * User-vetted routes carry a trusted strength prior (0.9) so a judgment-class
 * pick they explicitly configured is not crowded out by discovered local
 * capacity; the premium engine's ledger evidence refines this over time.
 */
function candidatesFromConfig(config) {
    // A tier route is vetted FOR ITS CLASS(ES): restrict it there so a cheap
    // bulk-tier pick cannot hijack judgment on cost. The fallback is the user's
    // any-class choice and stays unrestricted.
    const classesByKey = new Map();
    const routeByKey = new Map();
    for (const taskClass of modelRoutes.TASK_CLASSES) {
        const route = config.tiers?.[taskClass];
        if (!route) {
            continue;
        }
        const key = `${route.provider}/${route.model ?? '*'}`;
        routeByKey.set(key, route);
        classesByKey.set(key, [...(classesByKey.get(key) ?? []), taskClass]);
    }
    const out = [];
    const push = (route, taskClasses) => {
        const local = LOCAL_PROVIDERS.has(route.provider);
        out.push({
            provider: route.provider,
            ...(route.model ? { model: route.model } : {}),
            // Explicitly class-vetted (tier) routes outrank the any-class fallback.
            strength: taskClasses ? 0.95 : 0.9,
            ...(local ? { local: true, costPerMTokens: 0 } : { costPerMTokens: 10 }),
            ...(taskClasses ? { taskClasses } : {}),
        });
    };
    for (const [key, route] of routeByKey) {
        push(route, classesByKey.get(key));
    }
    if (config.fallback) {
        const fallbackKey = `${config.fallback.provider}/${config.fallback.model ?? '*'}`;
        if (routeByKey.has(fallbackKey)) {
            // Same route serves a tier AND the fallback → it is any-class after all.
            const existing = out.find((c) => `${c.provider}/${c.model ?? '*'}` === fallbackKey);
            if (existing) {
                delete existing.taskClasses;
            }
        }
        else {
            push(config.fallback);
        }
    }
    return out;
}
/** Parse a parameter-size hint ("qwen3:14b", "deepseek-r1:70b") → billions. */
function parseSizeB(model) {
    const m = /(\d+(?:\.\d+)?)\s*b\b/i.exec(model);
    return m ? Number(m[1]) : undefined;
}
/**
 * Map locally-pulled Ollama model names to candidates. Discovered models are
 * UNVETTED bulk capacity: strength scales with parameter size but is capped
 * at 0.5 so they win cheap/local classes without displacing the user's
 * configured judgment-class routes.
 */
function ollamaCandidates(models) {
    return models
        .filter((m) => typeof m === 'string' && m.trim() !== '')
        .map((model) => {
        const sizeB = parseSizeB(model);
        const strength = Math.min(0.5, 0.3 + (sizeB ?? 4) / 200);
        return { provider: 'ollama', model, local: true, costPerMTokens: 0, strength };
    });
}
/** Merge candidate lists, first occurrence of a provider/model pair wins. */
function mergeCandidates(...lists) {
    const out = [];
    const seen = new Set();
    for (const list of lists) {
        for (const c of list) {
            const key = `${c.provider}/${c.model ?? '*'}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            out.push(c);
        }
    }
    return out;
}
/**
 * Adapt a loaded PremiumApi into the ladder's `premium` delegate. Returns
 * undefined when the engine (or the method) is absent — the free build — so
 * the ladder skips the rung silently. An engine decline (throw) propagates;
 * the ladder catches it and degrades with a note.
 */
function premiumDelegate(premium, workspaceRoot, candidates) {
    const resolve = premium?.resolveModelRoute?.bind(premium);
    if (!resolve) {
        return undefined;
    }
    return async (taskClass) => {
        const rec = await resolve({ taskClass, workspaceRoot, context: { candidates } });
        return { provider: rec.provider, ...(rec.model ? { model: rec.model } : {}) };
    };
}
/**
 * Adapt a ZMLR client factory into the ladder's `zmlr` delegate. The task
 * class is passed as the recommendation intent; ZMLR's null (unreachable,
 * older server, handler failure) becomes a silent decline.
 */
function zmlrDelegate(makeClient) {
    return async (taskClass, endpoint) => {
        const rec = await makeClient(endpoint).recommendModel(taskClass);
        return rec ? { provider: 'zippymesh', model: rec.model } : undefined;
    };
}
/**
 * Shared setup for any Autopilot task-class resolution: normalize settings,
 * discover candidates (configured tiers + live local-provider enumeration),
 * and build the premium/ZMLR delegates. Both `resolveAllModelRoutes` (the
 * routing report command) and single-class callers (e.g. the Review Advisor
 * reasoner) build on this so candidate discovery runs once, consistently.
 */
async function buildRoutingContext(opts) {
    const config = (0, modelRoutes_1.normalizeModelRoutesConfig)(opts.rawConfig);
    const localModels = opts.listLocalModels ? await opts.listLocalModels() : [];
    const candidates = mergeCandidates(candidatesFromConfig(config), ollamaCandidates(localModels));
    const delegates = {
        premium: premiumDelegate(opts.premium, opts.workspaceRoot, candidates),
        zmlr: opts.zmlrClientFactory ? zmlrDelegate(opts.zmlrClientFactory) : undefined,
    };
    return { config, candidates, delegates };
}
/** Resolve every task class and render the routing report. */
async function resolveAllModelRoutes(opts) {
    const { config, candidates, delegates } = await buildRoutingContext(opts);
    const routes = [];
    for (const taskClass of modelRoutes.TASK_CLASSES) {
        routes.push(await (0, modelRoutes.resolveModelRoute)(taskClass, config, delegates));
    }
    const premiumUsed = routes.some((r) => r.source === 'premium');
    const lines = [
        '# Autopilot Model Routing',
        '',
        '## Resolved routes',
        '',
        '| task class | provider | model | via | note |',
        '|---|---|---|---|---|',
        ...routes.map((r) => `| ${r.taskClass} | ${r.provider} | ${r.model ?? '—'} | ${r.source} | ${r.note ?? ''} |`),
        '',
        premiumUsed
            ? '_Routes ranked by the AutoClaw Pro learned-routing engine._'
            : '_Static resolution (free build): tier table → fallback → host default. AutoClaw Pro ranks routes from your cost/effectiveness ledgers._',
        '',
        '## Configured table',
        '',
        (0, modelRoutes.describeRoutingTable)(config),
        '',
        '## Discovered candidates',
        '',
        candidates.length
            ? candidates.map((c) => `- \`${c.provider}/${c.model ?? '*'}\`${c.local ? ' (local)' : ''}`).join('\n')
            : '_None — set `autoclaw.autopilot.modelRoutes` tiers or start a local provider (Ollama)._',
        '',
        `_Generated ${new Date().toISOString()}._`,
    ];
    return { config, candidates, routes, markdown: lines.join('\n'), premiumUsed };
}
//# sourceMappingURL=routesService.js.map
