// Copied-adapted from ../../biomedical-wheel/wheel-starlight.d.ts;
// narrowed to the existing celestial renderer's actual controller.
export type WheelState = {
  paused: boolean;
  reduced: boolean;
  theme: 'dark' | 'light';
};
export type WheelController = {
  restart(): void;
  setState(state: Partial<WheelState>): void;
  dispose(): void;
};
export function createCelestialWheel(host: HTMLDivElement, options?: Partial<WheelState> & {
  onError?: () => void;
  onReady?: () => void;
  en?: boolean;
}): WheelController;
