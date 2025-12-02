// Real-time subscription hooks
export {
  usePresence,
  useUpdatePresence,
  useFollowStatus,
  useReactions,
  useRealtimeFeed,
} from './use-realtime';

// Debounce hook
export { useDebounce } from './use-debounce';

// Keyboard shortcuts
export {
  useKeyboardShortcuts,
  useShortcut,
  KeyboardShortcutsProvider,
} from './use-keyboard-shortcuts';

// Infinite scroll
export {
  useInfiniteScroll,
  useInfinitePagination,
  InfiniteScrollLoader,
  EndOfList,
  InfiniteScrollSentinel,
} from './use-infinite-scroll';

// Optimistic updates
export {
  useOptimistic,
  useOptimisticList,
  useOptimisticToggle,
  useOptimisticCounter,
  useOptimisticLike,
} from './use-optimistic';

// Form validation
export {
  useForm,
  useFieldValidation,
  validationPatterns,
} from './use-form';

// Clipboard
export {
  useCopyToClipboard,
  copyToClipboard,
  readFromClipboard,
  useClipboardRead,
} from './use-clipboard';

// Focus management
export {
  useFocusTrap,
  useModalFocus,
  useAutoFocus,
  useFocusLeave,
} from './use-focus';

// Media queries and responsive design
export {
  useMediaQuery,
  useBreakpoint,
  useBreakpointMax,
  useBreakpointBetween,
  useBreakpoints,
  usePrefersDarkMode,
  usePrefersReducedMotion,
  usePrefersContrast,
  useIsTouchDevice,
  useOrientation,
  useScreenSize,
  useWindowSize,
  useResponsiveValue,
  breakpoints,
} from './use-media-query';

// Storage
export {
  useLocalStorage,
  useSessionStorage,
  usePreferences,
  useRecentItems,
  storage,
} from './use-storage';
