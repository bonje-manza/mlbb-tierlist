import crypto from 'node:crypto';

export const GMS_HOST = 'https://api.gms.moontontech.com';
export const APP_ID = '2669606';
export const ACT_ID = '2669607';

/**
 * Computes Moonton HMAC-SHA1 signature token:
 * HMAC-SHA1(enigma, "POST\n<path>\n\n<jsonBody>") -> hex string
 */
export function generateGmsSignature(path: string, payload: unknown, enigma: string): string {
  const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const stringToSign = ['POST', path, '', bodyStr].join('\n');
  return crypto.createHmac('sha1', enigma).update(stringToSign).digest('hex');
}

export interface EnigmaHandshakeResult {
  enigma: string;
  serverTime?: number;
  cdnPrefix?: string;
}

/**
 * Performs dynamic handshake against Moonton GMS to retrieve runtime enigma secret.
 */
export async function fetchEnigma(fetchFn: typeof fetch = fetch): Promise<EnigmaHandshakeResult> {
  const res = await fetchFn(`${GMS_HOST}/api/act/basev4`, {
    method: 'GET',
    headers: {
      'X-AppId': APP_ID,
      'X-ActId': ACT_ID,
      'X-Lang': 'en'
    }
  });

  if (!res.ok) {
    throw new Error(`Enigma handshake failed: HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as any;
  const enigma = json?.data?.server?.enigma;
  if (!enigma) {
    throw new Error(`No enigma key found in basev4 handshake response (code ${json?.code}: ${json?.message || 'unknown error'})`);
  }

  return {
    enigma,
    serverTime: json.data?.server?.time,
    cdnPrefix: json.data?.client?.cdnPrefix
  };
}
