import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InboxItemType } from '@/types';
import type { AssistantMessage } from '@/features/assistant/types';
import { ASSISTANT_GREETING } from '@/features/assistant/types';

function createGreeting(): AssistantMessage {
  return {
    id: 'assistant-greeting',
    role: 'assistant',
    content: ASSISTANT_GREETING,
    createdAt: new Date().toISOString(),
  };
}

type UiState = {
  isSidebarCollapsed: boolean;
  toggleSidebar(): void;

  isOffline: boolean;
  setOffline(offline: boolean): void;

  isQuickCaptureOpen: boolean;
  quickCaptureType: InboxItemType;
  openQuickCapture(type?: InboxItemType): void;
  closeQuickCapture(): void;

  isCommandPaletteOpen: boolean;
  openCommandPalette(): void;
  closeCommandPalette(): void;

  isAssistantOpen: boolean;
  toggleAssistant(): void;
  closeAssistant(): void;

  assistantMessages: AssistantMessage[];
  appendAssistantMessage(message: AssistantMessage): void;
  clearAssistantMessages(): void;

  selectedTaskId: string | null;
  openTaskPanel(id: string): void;
  closeTaskPanel(): void;

  isNoteFocusMode: boolean;
  setNoteFocusMode(open: boolean): void;
  toggleNoteFocusMode(): void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      isOffline: false,
      setOffline: (offline) => set({ isOffline: offline }),

      isQuickCaptureOpen: false,
      quickCaptureType: 'note',
      openQuickCapture: (type = 'note') => set({ isQuickCaptureOpen: true, quickCaptureType: type }),
      closeQuickCapture: () => set({ isQuickCaptureOpen: false }),

      isCommandPaletteOpen: false,
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

      isAssistantOpen: false,
      toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
      closeAssistant: () => set({ isAssistantOpen: false }),

      assistantMessages: [createGreeting()],
      appendAssistantMessage: (message) =>
        set((state) => ({ assistantMessages: [...state.assistantMessages, message] })),
      clearAssistantMessages: () => set({ assistantMessages: [createGreeting()] }),

      selectedTaskId: null,
      openTaskPanel: (id) => set({ selectedTaskId: id }),
      closeTaskPanel: () => set({ selectedTaskId: null }),

      isNoteFocusMode: false,
      setNoteFocusMode: (open) => set({ isNoteFocusMode: open }),
      toggleNoteFocusMode: () =>
        set((state) => ({ isNoteFocusMode: !state.isNoteFocusMode })),
    }),
    {
      name: 'second-brain:ui',
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
    },
  ),
);
