export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(otp);
  return hasher.digest("hex");
}

export async function verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
  const hashed = await hashOtp(plainOtp);
  return hashed === hashedOtp;
}
