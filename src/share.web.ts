// En web no existe el menú Compartir del sistema: un provider vacío y un hook inerte.
import type { ReactNode } from 'react';

export type ShareIntent = {
  text?: string | null;
  webUrl?: string | null;
  meta?: Record<string, string | undefined> | null;
};

export function ShareIntentProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useShareIntentContext() {
  return {
    hasShareIntent: false,
    shareIntent: {} as ShareIntent,
    resetShareIntent: () => {},
    error: null as string | null,
  };
}
