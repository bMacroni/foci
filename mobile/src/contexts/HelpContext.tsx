import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { LayoutRectangle } from 'react-native';

export type HelpContent = Record<string, string>;

type TargetLayouts = Record<string, LayoutRectangle & { pageX: number; pageY: number }>;

interface HelpContextValue {
  isHelpOverlayActive: boolean;
  setIsHelpOverlayActive: (active: boolean) => void;
  helpContent: HelpContent;
  setHelpContent: (content: HelpContent) => void;
  registerTargetLayout: (helpId: string, layout: LayoutRectangle & { pageX: number; pageY: number }) => void;
  unregisterTargetLayout: (helpId: string) => void;
  targetLayouts: TargetLayouts;
}

const HelpContext = createContext<HelpContextValue | undefined>(undefined);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHelpOverlayActive, setIsHelpOverlayActive] = useState<boolean>(false);
  const [helpContent, _setHelpContent] = useState<HelpContent>({});
  const targetLayoutsRef = useRef<TargetLayouts>({});
  const [, forceRender] = useState(0);

  const setHelpContent = useCallback((content: HelpContent) => {
    _setHelpContent(content || {});
  }, []);

  const registerTargetLayout = useCallback((helpId: string, layout: LayoutRectangle & { pageX: number; pageY: number }) => {
    targetLayoutsRef.current = { ...targetLayoutsRef.current, [helpId]: layout };
    forceRender(v => v + 1);
  }, []);

  const unregisterTargetLayout = useCallback((helpId: string) => {
    if (targetLayoutsRef.current[helpId]) {
      const next = { ...targetLayoutsRef.current };
      delete next[helpId];
      targetLayoutsRef.current = next;
      forceRender(v => v + 1);
    }
  }, []);

  const value = useMemo<HelpContextValue>(() => ({
    isHelpOverlayActive,
    setIsHelpOverlayActive,
    helpContent,
    setHelpContent,
    registerTargetLayout,
    unregisterTargetLayout,
    targetLayouts: targetLayoutsRef.current,
  }), [isHelpOverlayActive, helpContent, registerTargetLayout, unregisterTargetLayout]);

  return (
    <HelpContext.Provider value={value}>{children}</HelpContext.Provider>
  );
};

export const useHelp = (): HelpContextValue => {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return ctx;
};


