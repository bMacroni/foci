import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, findNodeHandle, UIManager } from 'react-native';
import { Popable } from 'react-native-popable';
import { useHelp } from '../../contexts/HelpContext';
import { colors } from '../../themes/colors';

interface HelpTargetProps {
  helpId: string;
  children: React.ReactNode;
  style?: any;
}

export const HelpTarget: React.FC<HelpTargetProps> = ({ helpId, children, style }) => {
  const { isHelpOverlayActive, helpContent, registerTargetLayout, unregisterTargetLayout } = useHelp();
  const ref = useRef<View>(null);

  const measure = useCallback(() => {
    const node = findNodeHandle(ref.current);
    if (!node) { return; }
    UIManager.measure(node, (_x, _y, width, height, pageX, pageY) => {
      registerTargetLayout(helpId, { x: pageX, y: pageY, width, height, pageX, pageY });
    });
  }, [helpId, registerTargetLayout]);

  useEffect(() => {
    measure();
    const id = setInterval(measure, 500);
    return () => { clearInterval(id); unregisterTargetLayout(helpId); };
  }, [measure, helpId, unregisterTargetLayout]);

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


