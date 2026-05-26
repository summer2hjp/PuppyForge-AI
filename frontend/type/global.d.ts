export {};

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }

  interface PersonaUpdateEventDetail {
    persona?: {
      trust: number;
      neuroticism: number;
      energy: number;
      attachment: number;
    };
    memoriesCount?: number;
  }

  interface WindowEventMap {
    'persona-realtime-update': CustomEvent<PersonaUpdateEventDetail>;
    'puppy-forge-update': CustomEvent<unknown>;
  }
}
