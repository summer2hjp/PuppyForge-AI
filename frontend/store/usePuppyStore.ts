import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PersonaState {
  trust: number;
  neuroticism: number;
  energy: number;
  attachment: number;
}

interface PuppyStore {
  // 核心状态
  puppyId: string;
  healthScore: number;
  persona: PersonaState;
  rebelSuggestions: any[];
  lastDiagnosis: any | null;
  isRebelling: boolean;

  // Actions
  updateHealthScore: (score: number) => void;
  updatePersona: (newPersona: Partial<PersonaState>) => void;
  addRebelSuggestion: (suggestion: any) => void;
  setLastDiagnosis: (diagnosis: any) => void;
  setRebelling: (isRebelling: boolean) => void;
  resetStore: () => void;
}

export const usePuppyStore = create<PuppyStore>()(
  devtools(
    (set) => ({
      puppyId: "p001",
      healthScore: 87,
      persona: {
        trust: 0.82,
        neuroticism: 0.41,
        energy: 0.88,
        attachment: 0.93,
      },
      rebelSuggestions: [],
      lastDiagnosis: null,
      isRebelling: false,

      updateHealthScore: (score) =>
        set((state) => ({
          healthScore: Math.max(20, Math.min(100, score)),
        })),

      updatePersona: (newPersona) =>
        set((state) => ({
          persona: { ...state.persona, ...newPersona },
        })),

      addRebelSuggestion: (suggestion) =>
        set((state) => ({
          rebelSuggestions: [suggestion, ...state.rebelSuggestions].slice(0, 5),
          isRebelling: true,
        })),

      setLastDiagnosis: (diagnosis) =>
        set({ lastDiagnosis: diagnosis }),

      setRebelling: (isRebelling) =>
        set({ isRebelling }),

      resetStore: () =>
        set({
          healthScore: 87,
          persona: { trust: 0.8, neuroticism: 0.4, energy: 0.85, attachment: 0.9 },
          rebelSuggestions: [],
          lastDiagnosis: null,
          isRebelling: false,
        }),
    }),
    { name: 'PuppyForge-Store' }
  )
);
