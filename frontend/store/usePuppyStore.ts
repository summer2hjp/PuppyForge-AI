import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 🆕 添加诊断结果类型定义
export interface DiagnosisResult {
  coreIssues: string[];
  risks: string[];
  confidence: number;
  timestamp?: string;
  [key: string]: unknown; // 允许扩展字段
}

export interface PersonaState {
  trust: number;
  neuroticism: number;
  energy: number;
  attachment: number;
}

export interface RebelSuggestion {
  suggestion: string;
  risk_level: number;
  rebel_factor: number;
  reasoning: string;
  timestamp: string;
}

export interface PuppyForgeState {
  // 基础信息
  puppyId: string;
  puppyName: string;

  // 核心指标
  healthScore: number;
  persona: PersonaState;

  // 诊断与记忆
  lastDiagnosis: DiagnosisResult | null; 
  memoriesCount: number;

  // Rebel 系统
  rebelSuggestions: RebelSuggestion[];
  isRebelling: boolean;

  // Actions
  updateHealthScore: (score: number) => void;
  updatePersona: (partial: Partial<PersonaState>) => void;
  setLastDiagnosis: (diagnosis: DiagnosisResult | null) => void; 
  addRebelSuggestion: (suggestion: RebelSuggestion) => void; 
  incrementMemories: () => void;
  setRebelling: (value: boolean) => void;
  resetAll: () => void;
}

export const usePuppyStore = create<PuppyForgeState>()(
  devtools(
    persist(
      (set, get) => ({
        puppyId: "p001",
        puppyName: "小黄",
        healthScore: 87,
        persona: {
          trust: 0.82,
          neuroticism: 0.41,
          energy: 0.88,
          attachment: 0.93,
        },
        lastDiagnosis: null,
        memoriesCount: 87,
        rebelSuggestions: [],
        isRebelling: false,

        // ==================== Actions ====================
        updateHealthScore: (score: number) =>
          set((state) => ({
            healthScore: Math.max(20, Math.min(100, Math.round(score))),
          })),

        updatePersona: (partial: Partial<PersonaState>) => 
          set((state) => ({
            persona: { ...state.persona, ...partial },
          })),

        setLastDiagnosis: (diagnosis: DiagnosisResult | null) =>
          set({ lastDiagnosis: diagnosis }),

        addRebelSuggestion: (suggestion: RebelSuggestion) => 
          set((state) => ({
            rebelSuggestions: [
              { ...suggestion, timestamp: new Date().toISOString() },
              ...state.rebelSuggestions,
            ].slice(0, 6),
            isRebelling: true,
          })),

        incrementMemories: () =>
          set((state) => ({ memoriesCount: state.memoriesCount + 1 })),

        setRebelling: (value: boolean) => set({ isRebelling: value }),

        resetAll: () =>
          set({
            healthScore: 87,
            persona: { trust: 0.82, neuroticism: 0.41, energy: 0.88, attachment: 0.93 },
            lastDiagnosis: null,
            rebelSuggestions: [],
            isRebelling: false,
            memoriesCount: 87,
          }),
      }),
      {
        name: 'puppyforge-storage',
        partialize: (state) => ({
          puppyId: state.puppyId,
          puppyName: state.puppyName,
          persona: state.persona,
          memoriesCount: state.memoriesCount,
        }),
      }
    ),
    { name: 'PuppyForge-Store' }
  )
);
