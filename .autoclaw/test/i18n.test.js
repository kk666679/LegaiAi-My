import test from 'node:test';
import assert from 'node:assert/strict';
import { Translator, detect, CATALOG } from '../i18n/index.js';

test('i18n: EN/ MS catalogues exist', () => {
  assert.ok(CATALOG.en['conclusion.heading']);
  assert.ok(CATALOG.ms['conclusion.heading']);
});

test('i18n: t() returns per-language string', () => {
  const t = new Translator();
  assert.equal(t.t('conclusion.heading', 'en'), 'Conclusion');
  assert.equal(t.t('conclusion.heading', 'ms'), 'Kesimpulan');
});

test('i18n: t() falls back to key when missing', () => {
  assert.equal(new Translator().t('nope.missing', 'en'), 'nope.missing');
});

test('i18n: detect EN vs MS', () => {
  assert.equal(detect('The court held that the issue is…'), 'en');
  assert.equal(detect('Mahkamah telah memutuskan bahawa isu ini…'), 'ms');
  assert.equal(detect(''), 'en');
});

test('i18n: auto() picks language from text', () => {
  const t = new Translator();
  assert.equal(t.auto('conclusion.heading', 'The court held'), 'Conclusion');
  assert.equal(t.auto('conclusion.heading', 'Mahkamah undang-undang'), 'Kesimpulan');
});
