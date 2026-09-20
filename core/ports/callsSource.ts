import { IncomingCall } from '../entities/call';

// Calls history of the telephony provider, incoming calls only, oldest first
export type CallsSource = {
  getCalls: (from: string, to: string) => Promise<IncomingCall[]>
}
