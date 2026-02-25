import { onMounted, onUnmounted } from 'vue';

interface KeyboardNavOptions {
  onEscape?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  enabled?: () => boolean;
}

export function useKeyboardNav(options: KeyboardNavOptions) {
  function onKeydown(e: KeyboardEvent): void {
    // Don't trigger when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    // Also skip contenteditable elements
    if ((e.target as HTMLElement)?.isContentEditable) return;

    // Check if enabled
    if (options.enabled && !options.enabled()) return;

    switch (e.key) {
      case 'Escape':
        options.onEscape?.();
        break;
      case 'ArrowLeft':
        options.onLeft?.();
        break;
      case 'ArrowRight':
        options.onRight?.();
        break;
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown));
}
