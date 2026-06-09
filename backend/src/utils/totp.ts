import crypto from 'crypto';

// Base32 Alphabet
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function decodeBase32(str: string): Buffer {
  str = str.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (let i = 0; i < str.length; i++) {
    const val = ALPHABET.indexOf(str[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function encodeBase32(buffer: Buffer): string {
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  let str = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, '0');
    str += ALPHABET[parseInt(chunk, 2)];
  }
  return str;
}

export function generateSecret(length = 20): string {
  const randomBytes = crypto.randomBytes(length);
  return encodeBase32(randomBytes);
}

function calculateHOTP(key: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const hmacResult = hmac.digest();
  
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);
    
  return (code % 1000000).toString().padStart(6, '0');
}

export function verifyTOTP(token: string, secret: string, window = 1, timeStep = 30): boolean {
  try {
    const key = decodeBase32(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / timeStep);
    
    for (let i = -window; i <= window; i++) {
      const calculated = calculateHOTP(key, counter + i);
      if (calculated === token) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}
