'use client';

import { VoiceCallProvider } from '@/contexts/VoiceCallContext';
import IncomingCallNotification from './IncomingCallNotification';
import ActiveCallOverlay from './ActiveCallOverlay';
import type { Profile } from '@/types/database';

interface VoiceCallWrapperProps {
  children: React.ReactNode;
  profile: Profile;
}

export default function VoiceCallWrapper({ children, profile }: VoiceCallWrapperProps) {
  return (
    <VoiceCallProvider profile={profile}>
      {children}
      <IncomingCallNotification />
      <ActiveCallOverlay />
    </VoiceCallProvider>
  );
}
