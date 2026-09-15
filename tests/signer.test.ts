import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { generateGmsSignature, fetchEnigma, GMS_HOST, APP_ID, ACT_ID } from '../src/pipeline/signer.ts';

test('generateGmsSignature correctly computes HMAC-SHA1 hex digest', () => {
  const enigma = 'd70391ab690e8e59d925a93a4c1d1798';
  const path = '/api/gms/source/2669606/2756567';
  const payload = { pageSize: 1, filters: [] };

  const stringToSign = ['POST', path, '', JSON.stringify(payload)].join('\n');
  const expectedSignature = crypto.createHmac('sha1', enigma).update(stringToSign).digest('hex');

  const actualSignature = generateGmsSignature(path, payload, enigma);
  assert.equal(actualSignature, expectedSignature);
});

test('fetchEnigma handles mock successful handshake and error envelope', async () => {
  // Successful handshake mock
  const mockFetchSuccess = async (url: string | URL | Request, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers['X-AppId'], APP_ID);
    assert.equal(headers['X-ActId'], ACT_ID);
    return new Response(JSON.stringify({
      code: 0,
      message: 'OK',
      data: {
        server: { enigma: 'test-enigma-12345', time: 1789406635741 },
        client: { cdnPrefix: 'https://cdn.example.com' }
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const result = await fetchEnigma(mockFetchSuccess as any);
  assert.equal(result.enigma, 'test-enigma-12345');
  assert.equal(result.serverTime, 1789406635741);
  assert.equal(result.cdnPrefix, 'https://cdn.example.com');

  // Error handshake mock (missing enigma)
  const mockFetchNoEnigma = async () => {
    return new Response(JSON.stringify({
      code: 500,
      message: 'Internal Error',
      data: {}
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await assert.rejects(async () => {
    await fetchEnigma(mockFetchNoEnigma as any);
  }, /No enigma key found/);

  // HTTP error mock
  const mockFetchHttpError = async () => {
    return new Response('Not Found', { status: 404, statusText: 'Not Found' });
  };

  await assert.rejects(async () => {
    await fetchEnigma(mockFetchHttpError as any);
  }, /HTTP 404/);
});
