import { ClientInfo, describeDevice } from '@/core/entities/access';

type HeaderSource = { get: (name: string) => string | null | undefined }

const MAX_IP_LENGTH = 64;

// The address of the browser as the hosting reports it. On Vercel x-forwarded-for is set by the platform
// and can not be forged by a client; the first address of the chain is the client. Locally it is ::1.
export const clientIp = (headers: HeaderSource): string | null => {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || headers.get('x-real-ip')?.trim();

  return ip ? ip.slice(0, MAX_IP_LENGTH) : null;
};

export const clientInfo = (headers: HeaderSource): ClientInfo => ({
  ip: clientIp(headers),
  device: describeDevice(headers.get('user-agent')),
});
