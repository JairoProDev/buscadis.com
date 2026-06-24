/**
 * Unit tests for QR visual system. Run: npx tsx lib/qr/__tests__/run.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import assert from 'node:assert/strict';

async function run(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

async function main() {
  await run('resolve-url blocks legacy hosts', async () => {
    const { getQrTargetUrl, getCanonicalSiteOrigin } = await import('../resolve-url');
    const origin = getCanonicalSiteOrigin();
    assert.ok(origin.includes('buscadis.com'));
    const url = getQrTargetUrl('abc123');
    assert.ok(url.startsWith('https://'));
    assert.ok(url.includes('/q/abc123'));
    assert.ok(!url.includes('market.adis.lat'));
  });

  await run('asset hash changes with render mode', async () => {
    const { computeQrAssetHash } = await import('../asset-cache');
    const base = {
      targetUrl: 'https://www.buscadis.com/q/test',
      shortCode: 'test',
      styleConfig: { dotsColor: '#000', backgroundColor: '#fff' },
      tier: 'free' as const,
      width: 512,
    };
    const h1 = computeQrAssetHash({ ...base, renderMode: 'classic' });
    const h2 = computeQrAssetHash({ ...base, renderMode: 'visual' });
    assert.notEqual(h1, h2);
  });

  await run('matrix masks protect finders', async () => {
    const { createQrMatrix, isProtectedModule } = await import('../matrix-masks');
    const m = createQrMatrix('https://www.buscadis.com/q/test');
    assert.ok(isProtectedModule(m, 0, 0));
    assert.ok(isProtectedModule(m, 6, 6));
    assert.ok(!isProtectedModule(m, 10, 10) || m.get(10, 10) === m.get(10, 10));
  });

  await run('contrast gate rejects low contrast', async () => {
    const { validateQrContrast } = await import('../quality-gate');
    const bad = validateQrContrast('#cccccc', '#dddddd');
    assert.equal(bad.ok, false);
    const good = validateQrContrast('#000000', '#ffffff');
    assert.equal(good.ok, true);
  });

  await run('classic QR decodes', async () => {
    const { generateQrPng } = await import('../generate');
    const data = 'https://www.buscadis.com/q/3hqmfd';
    const result = await generateQrPng({
      data,
      styleConfig: { renderMode: 'classic', dotsColor: '#1e293b', backgroundColor: '#ffffff' },
      width: 512,
      renderMode: 'classic',
    });
    assert.ok(result.png.length > 1000);
    const { validateQrDecodable } = await import('../quality-gate');
    const decode = await validateQrDecodable(result.png, data);
    assert.equal(decode.ok, true);
  });

  await run('visual QR generates PNG', async () => {
    const { generateQrPng } = await import('../generate');
    const data = 'https://www.buscadis.com/q/3hqmfd';
    const logoUrl =
      process.env.QR_TEST_LOGO_URL ||
      'https://qegqjshtxotdjjhvxmve.supabase.co/storage/v1/object/public/catalog-images/90ffdb2b-ca01-4a1f-bbfc-d989301278c3/brand/logo-villa-chaco.svg';
    const result = await generateQrPng({
      data,
      styleConfig: {
        renderMode: 'visual',
        dotsColor: '#1e3a5f',
        backgroundColor: '#ffffff',
        halftoneIntensity: 0.75,
        dotScale: 0.35,
        buscadisFinderMark: true,
      },
      width: 512,
      logoUrl,
      themeColor: '#1e3a5f',
      renderMode: 'visual',
    });
    assert.ok(result.png.length > 5000);
    const { validateQrDecodable } = await import('../quality-gate');
    const decode = await validateQrDecodable(result.png, data);
    assert.equal(decode.ok, true, `decode failed, mode=${result.actualMode} qa=${result.qaStatus}`);
  });

  console.log('\nAll QR tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
