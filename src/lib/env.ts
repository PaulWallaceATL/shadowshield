function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function validateAuthEnv(): void {
  requireEnv("NEXTAUTH_SECRET");
  requireEnv("NEXTAUTH_URL");
}

export function getEncryptionKey(): string {
  return requireEnv("ENCRYPTION_KEY");
}

