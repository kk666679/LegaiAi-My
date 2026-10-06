import * as datasetBundle from './datasets/index.js';

const loadAll = typeof datasetBundle.loadAll === 'function' ? datasetBundle.loadAll : () => datasetBundle;
const loadGroup = typeof datasetBundle.loadGroup === 'function' ? datasetBundle.loadGroup : () => [];
const validate = typeof datasetBundle.validate === 'function' ? datasetBundle.validate : () => ({ ok: true, problems: [] });
const counts = typeof datasetBundle.counts === 'function' ? datasetBundle.counts : () => ({ total: 0 });
const GROUPS = Array.isArray(datasetBundle.GROUPS) ? datasetBundle.GROUPS : [];
const datasetApi = { loadAll, loadGroup, validate, counts, GROUPS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = datasetApi;
}

export * from './datasets/index.js';
export { loadAll, loadGroup, validate, counts, GROUPS };
export default datasetApi;
