import { describe, expect, it } from 'vitest';
import { isPushSupported, urlBase64ToUint8Array } from './push-client';

describe('push client', () => {
  it('decodes a VAPID public key into an uncompressed P-256 point', () => {
    const bytes = urlBase64ToUint8Array(
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
    );

    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(0x04);
  });

  it('reports push unsupported when the browser exposes no service worker', () => {
    expect(isPushSupported()).toBe(false);
  });
});
