// ZIPPY OPEN MATERIAL
//
// Autopilot model routing: resolve a task class (bulk / judgment / review /
// verify) to a concrete provider+model using the user's configured tier table
// (`autoclaw.autopilot.modelRoutes`). The continuous-dev directive references
// task classes, never model literals, so the same directive runs on whatever
// providers the user actually has connected.
//
// The free build resolves statically: tier table → fallback → host default.
// Learned routing (cost/effectiveness-ledger driven, or a ZMLR endpoint) plugs
// in as optional async delegates tried before the static table — see
// PremiumApi.resolveModelRoute. A delegate that is absent, declines, or throws
// simply drops resolution to the next rung; routing never hard-fails.
export { normalizeModelRoutesConfig as normalizeModelRoutesConfig };
export { resolveModelRoute as resolveModelRoute };
export { describeRoutingTable as describeRoutingTable };
export const TASK_CLASSES = ['bulk', 'judgment', 'review', 'verify'];
const HOST_DEFAULT = { provider: 'host-default' };
function isTaskClass(value) {
    return typeof value === 'string' && exports.TASK_CLASSES.includes(value);
}
function coerceRoute(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const provider = raw.provider;
    if (typeof provider !== 'string' || provider.trim() === '')
        return undefined;
    const model = raw.model;
    return typeof model === 'string' && model.trim() !== ''
        ? { provider: provider.trim(), model: model.trim() }
        : { provider: provider.trim() };
}
/**
 * Defensively normalize a raw settings value (users hand-edit this JSON).
 * Invalid entries are dropped, never thrown on.
 */
function normalizeModelRoutesConfig(raw) {
    if (!raw || typeof raw !== 'object')
        return {};
    const obj = raw;
    const config = {};
    const resolver = obj.resolver;
    if (resolver === 'auto' || resolver === 'static' || resolver === 'zmlr' || resolver === 'host-default') {
        config.resolver = resolver;
    }
    if (typeof obj.zmlrEndpoint === 'string' && obj.zmlrEndpoint.trim() !== '') {
        config.zmlrEndpoint = obj.zmlrEndpoint.trim();
    }
    if (obj.tiers && typeof obj.tiers === 'object') {
        const tiers = {};
        for (const [key, value] of Object.entries(obj.tiers)) {
            if (!isTaskClass(key))
                continue;
            const route = coerceRoute(value);
            if (route)
                tiers[key] = route;
        }
        if (Object.keys(tiers).length > 0)
            config.tiers = tiers;
    }
    const fallback = coerceRoute(obj.fallback);
    if (fallback)
        config.fallback = fallback;
    return config;
}
async function tryDelegate(run) {
    try {
        const route = await run();
        return route && typeof route.provider === 'string' && route.provider.trim() !== ''
            ? { route }
            : {};
    }
    catch {
        return { failed: true };
    }
}
/**
 * Resolve one task class through the ladder:
 * premium delegate → zmlr delegate → static tier → fallback → host default.
 * `resolver` narrows the ladder ('static' skips delegates; 'zmlr' skips
 * premium; 'host-default' skips everything). Never throws.
 */
async function resolveModelRoute(taskClass, config, delegates) {
    const mode = config.resolver ?? 'auto';
    const notes = [];
    if (mode !== 'host-default') {
        if (mode === 'auto' && delegates?.premium) {
            const attempt = await tryDelegate(() => delegates.premium(taskClass));
            if (attempt.route)
                return { ...attempt.route, taskClass, source: 'premium' };
            if (attempt.failed)
                notes.push('premium resolver failed');
        }
        if ((mode === 'auto' || mode === 'zmlr') && delegates?.zmlr) {
            if (config.zmlrEndpoint) {
                const endpoint = config.zmlrEndpoint;
                const attempt = await tryDelegate(() => delegates.zmlr(taskClass, endpoint));
                if (attempt.route)
                    return { ...attempt.route, taskClass, source: 'zmlr' };
                if (attempt.failed)
                    notes.push('zmlr resolver failed');
            }
            else if (mode === 'zmlr') {
                notes.push('resolver is zmlr but zmlrEndpoint is not configured');
            }
        }
        const tier = config.tiers?.[taskClass];
        if (tier) {
            return { ...tier, taskClass, source: 'static', note: notes.length ? notes.join('; ') : undefined };
        }
        if (config.fallback) {
            return { ...config.fallback, taskClass, source: 'fallback', note: notes.length ? notes.join('; ') : undefined };
        }
        notes.push(`no tier or fallback configured for '${taskClass}'`);
    }
    return { ...HOST_DEFAULT, taskClass, source: 'host-default', note: notes.length ? notes.join('; ') : undefined };
}
/** Markdown summary of the routing table for status surfaces and run reports. */
function describeRoutingTable(config) {
    const lines = ['| task class | provider | model |', '|---|---|---|'];
    for (const taskClass of exports.TASK_CLASSES) {
        const route = config.tiers?.[taskClass] ?? config.fallback ?? HOST_DEFAULT;
        const via = config.tiers?.[taskClass] ? '' : config.fallback ? ' (fallback)' : ' (host default)';
        lines.push(`| ${taskClass} | ${route.provider}${via} | ${route.model ?? '—'} |`);
    }
    lines.push('', `Resolver mode: ${config.resolver ?? 'auto'}${config.zmlrEndpoint ? ` · ZMLR: ${config.zmlrEndpoint}` : ''}`);
    return lines.join('\n');
}
//# sourceMappingURL=modelRoutes.js.map
