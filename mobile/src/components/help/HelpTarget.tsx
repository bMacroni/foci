import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Popable } from 'react-native-popable';
import { useHelp, useHelpLocalScope } from '../../contexts/HelpContext';
import { colors } from '../../themes/colors';

interface HelpTargetProps {
  helpId: string;
  children: React.ReactNode;
  style?: any;
}

export const HelpTarget: React.FC<HelpTargetProps> = ({ helpId, children, style }) => {
  const { isHelpOverlayActive, helpContent, registerTargetLayout, unregisterTargetLayout, currentScope } = useHelp();
  const localScope = useHelpLocalScope();
  const ref = useRef<View>(null);
  const lastLayoutRef = useRef<{ x: number; y: number; width: number; height: number; pageX: number; pageY: number } | null>(null);
  const [lastRegisteredScope, setLastRegisteredScope] = useState<string | null>(null);

  const measure = useCallback(() => {
    if (!ref.current) { return; }
    
    ref.current.measure((x, y, width, height, pageX, pageY) => {
      const next = { x: pageX, y: pageY, width, height, pageX, pageY };
      const prev = lastLayoutRef.current;
      const changed = !prev
        || Math.abs(prev.x - next.x) > 0.5
        || Math.abs(prev.y - next.y) > 0.5
        || Math.abs(prev.width - next.width) > 0.5
        || Math.abs(prev.height - next.height) > 0.5;
      
      if (changed) {
        lastLayoutRef.current = next;
        const targetScope = localScope || 'default';
        
        // Unregister from previous scope if it exists and is different
        if (lastRegisteredScope && lastRegisteredScope !== targetScope) {
          unregisterTargetLayout(helpId, lastRegisteredScope);
        }
        
        if (!localScope || localScope === (currentScope || 'default')) {
          registerTargetLayout(helpId, next, targetScope);
          setLastRegisteredScope(targetScope);
        }
      }
    });
  }, [helpId, registerTargetLayout, unregisterTargetLayout, currentScope, localScope, lastRegisteredScope]);

  useEffect(() => {
    measure();
    return () => { 
      // Clean up from the last registered scope, not just the current local scope
      if (lastRegisteredScope) {
        unregisterTargetLayout(helpId, lastRegisteredScope);
      }
    };
  }, [measure, helpId, unregisterTargetLayout, lastRegisteredScope]);

  // Re-measure when help mode toggles to ensure accurate layout while overlay is active
  useEffect(() => {
    measure();
  }, [measure, isHelpOverlayActive]);

  // Re-measure when the help scope changes so targets register under the active screen
  useEffect(() => {
    // Clean up from previous scope before changing
    if (lastRegisteredScope) {
      unregisterTargetLayout(helpId, lastRegisteredScope);
      setLastRegisteredScope(null);
    }
    lastLayoutRef.current = null;
    measure();
  }, [measure, currentScope, localScope, helpId, unregisterTargetLayout, lastRegisteredScope]);

  const baseId = React.useMemo(() => {
    const idx = helpId.indexOf(':');
    return idx > -1 ? helpId.slice(0, idx) : helpId;
  }, [helpId]);
  const content = helpContent?.[helpId] || helpContent?.[baseId] || '';

  // Do not alter layout when help mode is inactive
  if (!isHelpOverlayActive) {
    return (
      <View ref={ref} onLayout={measure} style={style}>
        {children}
      </View>
    );
  }

  return (
    <View ref={ref} onLayout={measure} style={style}>
      <Popable content={content} position="bottom" visible={isHelpOverlayActive ? undefined : false}>
        {/* Disable child interactions while help is active so only tooltip opens */}
        <View pointerEvents={isHelpOverlayActive ? 'none' : 'auto'}>
          {children}
        </View>
      </Popable>
    </View>
  );
};

const styles = StyleSheet.create({
  highlight: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
});

export default HelpTarget;


