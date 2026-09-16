import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchRankTelemetryWithFailover } from '../src/pipeline/fetcher.ts';
import type { RawGmsRecord } from '../src/types/index.ts';

const mockHeroRecord: RawGmsRecord = {
  _updatedAt: 1789400000000,
  data: {
    main_heroid: 1,
    main_hero_win_rate: 0.54,
    main_hero_appearance_rate: 0.02,
    main_hero_ban_rate: 0.05,
    main_hero: { data: { name: 'Miya', head: 'https://cdn/miya.png' } }
  }
};

test('fetchRankTelemetryWithFailover uses primary GMS endpoint on success', async () => {
  let gmsCalled = false;
  let roneCalled = false;

  const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    if (urlStr.includes('/api/act/basev4')) {
      return new Response(JSON.stringify({
        code: 0,
        data: { server: { enigma: 'test-enigma' } }
      }), { status: 200 });
    }
    if (urlStr.includes('/api/gms/source/')) {
      gmsCalled = true;
      return new Response(JSON.stringify({
        code: 0,
        message: 'OK',
        data: { records: [mockHeroRecord], total: 1 }
      }), { status: 200 });
    }
    if (urlStr.includes('arena.rone.dev')) {
      roneCalled = true;
      return new Response(JSON.stringify({ code: 0, data: { records: [] } }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const result = await fetchRankTelemetryWithFailover('mythic', '1d', { fetchFn: mockFetch as any });
  assert.equal(result.source, 'moonton-gms');
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].data.main_heroid, 1);
  assert.equal(gmsCalled, true);
  assert.equal(roneCalled, false);
});

test('fetchRankTelemetryWithFailover gracefully falls back to secondary Rone Arena when GMS fails', async () => {
  let gmsCalled = false;
  let roneCalled = false;

  const mockFetch = async (url: string | URL | Request) => {
    const urlStr = url.toString();
    if (urlStr.includes('api.gms.moontontech.com')) {
      gmsCalled = true;
      // Primary GMS fails with HTTP 500
      return new Response('Internal Server Error', { status: 500, statusText: 'Server Error' });
    }
    if (urlStr.includes('arena.rone.dev')) {
      roneCalled = true;
      // Secondary succeeds
      return new Response(JSON.stringify({
        code: 0,
        message: 'OK',
        data: { records: [mockHeroRecord], total: 1 }
      }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const result = await fetchRankTelemetryWithFailover('mythic', '1d', { fetchFn: mockFetch as any });
  assert.equal(result.source, 'rone-arena');
  assert.equal(result.records.length, 1);
  assert.equal(gmsCalled, true);
  assert.equal(roneCalled, true);
});

test('fetchRankTelemetryWithFailover gracefully falls back to secondary when GMS returns envelope error (code !== 0)', async () => {
  const mockFetch = async (url: string | URL | Request) => {
    const urlStr = url.toString();
    if (urlStr.includes('/api/act/basev4')) {
      return new Response(JSON.stringify({ code: 0, data: { server: { enigma: 'test-enigma' } } }), { status: 200 });
    }
    if (urlStr.includes('/api/gms/source/')) {
      // Envelope error
      return new Response(JSON.stringify({ code: 400, message: 'Invalid token' }), { status: 200 });
    }
    if (urlStr.includes('arena.rone.dev')) {
      return new Response(JSON.stringify({
        code: 0,
        data: { records: [mockHeroRecord], total: 1 }
      }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const result = await fetchRankTelemetryWithFailover('mythic', '7d', { fetchFn: mockFetch as any });
  assert.equal(result.source, 'rone-arena');
  assert.equal(result.records.length, 1);
});

test('fetchRankTelemetryWithFailover falls back to tertiary airgap snapshot when both networks fail', async () => {
  const tmpAirgapDir = path.resolve('tests/fixtures/airgap');
  await fs.mkdir(tmpAirgapDir, { recursive: true });
  const airgapFilePath = path.join(tmpAirgapDir, 'raw-mythic-1d.json');
  await fs.writeFile(airgapFilePath, JSON.stringify([mockHeroRecord]), 'utf8');

  const mockFailingFetch = async () => {
    throw new Error('Network offline');
  };

  const result = await fetchRankTelemetryWithFailover('mythic', '1d', {
    fetchFn: mockFailingFetch as any,
    airgapDir: tmpAirgapDir
  });

  assert.equal(result.source, 'airgap-snapshot');
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].data.main_heroid, 1);

  // Clean up fixture
  await fs.rm(tmpAirgapDir, { recursive: true, force: true });
});

test('fetchRankTelemetryWithFailover bypasses Rone Arena and falls directly to airgap for extended tiers', async () => {
  const tmpAirgapDir = path.resolve('tests/fixtures/airgap_extended');
  await fs.mkdir(tmpAirgapDir, { recursive: true });
  const airgapFilePath = path.join(tmpAirgapDir, 'raw-glory-3d.json');
  await fs.writeFile(airgapFilePath, JSON.stringify([mockHeroRecord]), 'utf8');

  let roneCalled = false;
  const mockFetch = async (url: string | URL | Request) => {
    const urlStr = url.toString();
    if (urlStr.includes('api.gms.moontontech.com')) {
      throw new Error('GMS offline');
    }
    if (urlStr.includes('arena.rone.dev')) {
      roneCalled = true;
      return new Response(JSON.stringify({ code: 0, data: { records: [] } }));
    }
    return new Response('Not Found', { status: 404 });
  };

  const result = await fetchRankTelemetryWithFailover('glory', '3d', {
    fetchFn: mockFetch as any,
    airgapDir: tmpAirgapDir
  });

  assert.equal(result.source, 'airgap-snapshot');
  assert.equal(result.records.length, 1);
  assert.equal(roneCalled, false, 'Rone Arena must not be called for extended tiers');

  await fs.rm(tmpAirgapDir, { recursive: true, force: true });
});
