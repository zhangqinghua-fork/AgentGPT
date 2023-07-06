import { createSelectors } from "./helpers";
import type { StateCreator } from "zustand";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type AutonomousAgent from "../services/agent/autonomous-agent";
import type { ActiveTool } from "../hooks/useTools";
import type { AgentLifecycle } from "../services/agent/agent-run-model";

interface AgentSlice {
  agent: AutonomousAgent | null;
  lifecycle: AgentLifecycle;
  setLifecycle: (AgentLifecycle) => void;
  isAgentThinking: boolean;
  setIsAgentThinking: (isThinking: boolean) => void;
  setAgent: (newAgent: AutonomousAgent | null) => void;
}

const initialAgentState = {
  agent: null,
  lifecycle: "offline" as const,
  isAgentThinking: false,
  isAgentPaused: undefined,
};

interface ToolsSlice {
  tools: Omit<ActiveTool, "active">[];
  setTools: (tools: ActiveTool[]) => void;
}

const resetters: (() => void)[] = [];

const createAgentSlice: StateCreator<AgentSlice> = (set, get) => {
  resetters.push(() => set(initialAgentState));
  return {
    ...initialAgentState,
    setLifecycle: (lifecycle: AgentLifecycle) => {
      set(() => ({
        lifecycle: lifecycle,
      }));
    },
    setIsAgentThinking: (isThinking: boolean) => {
      set(() => ({
        isAgentThinking: isThinking,
      }));
    },
    setAgent: (newAgent) => {
      set(() => ({
        agent: newAgent,
      }));

      if (get().agent === null) {
        resetters.forEach((resetter) => resetter());
      }
    },
  };
};

const createToolsSlice: StateCreator<ToolsSlice> = (set) => {
  return {
    tools: [],
    setTools: (tools) => {
      set(() => ({
        tools: tools,
      }));
    },
  };
};

export const useAgentStore = createSelectors(
  create<AgentSlice & ToolsSlice>()(
    persist(
      (...a) => ({
        ...createAgentSlice(...a),
        ...createToolsSlice(...a),
      }),
      {
        name: "agent-storage-v2",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tools: state.tools,
        }),
      }
    )
  )
);
