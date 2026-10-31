export type DiscoveryObservatoryController = {
  setState(next: { en?: boolean; reduced?: boolean; paused?: boolean; theme?: 'dark' | 'light' }): void;
  restart(): void;
  dispose(): void;
};
export function createDiscoveryObservatory(host: HTMLDivElement, options?: {
  en?: boolean;
  reduced?: boolean;
  paused?: boolean;
  theme?: 'dark' | 'light';
  onReady?: () => void;
  onError?: () => void;
}): DiscoveryObservatoryController;
