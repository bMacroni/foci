import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, findNodeHandle, UIManager } from 'react-native';
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

  const measure = useCallback(() => {
    const node = findNodeHandle(ref.current);
    if (!node) { return; }
    UIManager.measure(node, (_x, _y, width, height, pageX, pageY) => {
      const next = { x: pageX, y: pageY, width, height, pageX, pageY };
      const prev = lastLayoutRef.current;
      const changed = !prev
        || Math.abs(prev.x - next.x) > 0.5
        || Math.abs(prev.y - next.y) > 0.5
        || Math.abs(prev.width - next.width) > 0.5
        || Math.abs(prev.height - next.height) > 0.5;
      if (changed) {
        lastLayoutRef.current = next;
        if (!localScope || localScope === (currentScope || 'default')) {
          registerTargetLayout(helpId, next);
        }
      }
    });
  }, [helpId, registerTargetLayout, currentScope, localScope]);

  useEffect(() => {
    measure();
    return () => { unregisterTargetLayout(helpId); };
  }, [measure, helpId, unregisterTargetLayout]);

  // Re-measure when help mode toggles to ensure accurate layout while overlay is active
  useEffect(() => {
    measure();
  }, [measure, isHelpOverlayActive]);

  // Re-measure when the help scope changes so targets register under the active screen
  useEffect(() => {
    lastLayoutRef.current = null;
    measure();
  }, [measure, currentScope, localScope]);

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


