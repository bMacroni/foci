import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BrainDumpItem = {
  text: string;
  type: 'task' | 'goal';
  confidence?: number;
  category?: string | null;
  stress_level: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
};

type BrainDumpContextValue = {
  threadId: string;
  items: BrainDumpItem[];
  setThreadId: (id: string) => void;
  setItems: (updater: BrainDumpItem[] | ((prev: BrainDumpItem[]) => BrainDumpItem[])) => void;
  clearSession: () => Promise<void>;
};

const BrainDumpContext = createContext<BrainDumpContextValue | undefined>(undefined);

const SESSION_KEY = 'brainDumpSession';

export function BrainDumpProvider({ children }: { children: React.ReactNode }) {
  const [threadId, setThreadIdState] = useState<string>('');
  const [items, setItemsState] = useState<BrainDumpItem[]>([]);

  // Hydrate from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.threadId === 'string') setThreadIdState(parsed.threadId);
            if (Array.isArray(parsed.items)) setItemsState(parsed.items);
          }
        }
      } catch {}
    })();
  }, []);

  // Autosave on change (debounced-ish via batching of state changes)
  useEffect(() => {
    (async () => {
      try {
        const payload = JSON.stringify({ threadId, items });
        await AsyncStorage.setItem(SESSION_KEY, payload);
        // Backward-compat keys used elsewhere
        await AsyncStorage.multiSet([
          ['lastBrainDumpThreadId', threadId],
          ['lastBrainDumpItems', JSON.stringify(items)],
        ]);
      } catch {}
    })();
  }, [threadId, items]);

  const setItems: BrainDumpContextValue['setItems'] = (updater) => {
    setItemsState(prev => (typeof updater === 'function' ? (updater as any)(prev) : updater));
  };

  const setThreadId: BrainDumpContextValue['setThreadId'] = (id) => {
    setThreadIdState(id);
  };

  const clearSession = async () => {
    try {
      setThreadIdState('');
      setItemsState([]);
      await AsyncStorage.multiRemove([SESSION_KEY, 'lastBrainDumpThreadId', 'lastBrainDumpItems']);
    } catch {}
  };

  const value = useMemo<BrainDumpContextValue>(() => ({ threadId, items, setThreadId, setItems, clearSession }), [threadId, items]);

  return <BrainDumpContext.Provider value={value}>{children}</BrainDumpContext.Provider>;
}

export function useBrainDump(): BrainDumpContextValue {
  const ctx = useContext(BrainDumpContext);
  if (!ctx) {
    throw new Error('useBrainDump must be used within a BrainDumpProvider');
  }
  return ctx;
}


