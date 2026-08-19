import { Buffer } from 'buffer';

export function xorEncrypt(plaintext: string, key: string): string {
  if (!key) {
    throw new Error('Encryption key is missing.');
  }
  const textBuffer = Buffer.from(plaintext, 'utf8');
  const keyBuffer = Buffer.from(key, 'utf8');
  const resultBuffer = Buffer.alloc(textBuffer.length);

  for (let i = 0; i < textBuffer.length; i++) {
    resultBuffer[i] = textBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }

  return resultBuffer.toString('base64');
}

export function xorDecrypt(base64Ciphertext: string, key: string): string {
  if (!key) {
    throw new Error('Decryption key is missing.');
  }
  const ciphertextBuffer = Buffer.from(base64Ciphertext, 'base64');
  const keyBuffer = Buffer.from(key, 'utf8');
  const resultBuffer = Buffer.alloc(ciphertextBuffer.length);

  for (let i = 0; i < ciphertextBuffer.length; i++) {
    resultBuffer[i] = ciphertextBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }

  return resultBuffer.toString('utf8');
}
