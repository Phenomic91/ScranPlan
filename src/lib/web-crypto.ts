import * as ExpoCrypto from 'expo-crypto';

/**
 * Hermes has no Web Crypto API. Supabase's PKCE sign-in needs secure random
 * values and SHA-256 from it, and quietly falls back to Math.random and a plain
 * (unhashed) code challenge without them. Fill in just those two from expo-crypto.
 */
type WebCryptoShim = {
  getRandomValues?: Crypto['getRandomValues'];
  subtle?: Pick<SubtleCrypto, 'digest'>;
};

const webCrypto = ((globalThis as { crypto?: WebCryptoShim }).crypto ??= {});

webCrypto.getRandomValues ??= ExpoCrypto.getRandomValues as Crypto['getRandomValues'];

webCrypto.subtle ??= {
  digest: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
    if (algorithm !== 'SHA-256') throw new Error(`Unsupported digest: ${String(algorithm)}`);
    return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data);
  },
};
