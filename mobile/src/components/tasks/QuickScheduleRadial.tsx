import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Text } from 'react-native';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Octicons';
import { colors } from '../../themes/colors';
// spacing/typography not used in Simon-style UI

export type QuickSchedulePreset = 'today' | 'tomorrow' | 'this_week' | 'next_week';

interface QuickScheduleRadialProps {
  visible: boolean;
  center?: { x: number; y: number };
  onSelect: (preset: QuickSchedulePreset) => void;
  onClose: () => void;
  openTimestamp?: number;
}

const RADIUS = 96;
const INNER_CANCEL_RADIUS = 52; // distance from center treated as cancel zone

const OPTIONS: Array<{ key: QuickSchedulePreset; label: string; icon: string }> = [
  { key: 'today', label: 'Today', icon: 'sun' },
  { key: 'tomorrow', label: 'Tomorrow', icon: 'arrow-right' },
  { key: 'this_week', label: 'This week', icon: 'calendar' },
  { key: 'next_week', label: 'Next week', icon: 'calendar' },
];

const QuickScheduleRadial: React.FC<QuickScheduleRadialProps> = ({ visible, center, onSelect, onClose, openTimestamp }) => {
  const screen = Dimensions.get('window');
  const cx = center?.x ?? screen.width / 2;
  const cy = center?.y ?? screen.height / 2;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverCenter, setHoverCenter] = useState<boolean>(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // For Simon-style layout we always use 4 quadrants at 0/90/180/270.
  const anglesRad = useMemo(() => [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2], []);

  const getIndexFromPoint = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    const angle = (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);
    let bestIdx = 0;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < anglesRad.length; i++) {
      let diff = Math.abs(angle - anglesRad[i]);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const onGestureEvent = (e: PanGestureHandlerGestureEvent) => {
    if (!startRef.current) return;
    const x = startRef.current.x + e.nativeEvent.translationX;
    const y = startRef.current.y + e.nativeEvent.translationY;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist <= INNER_CANCEL_RADIUS) {
      setHoverCenter(true);
      setHoverIndex(null);
      return;
    }
    setHoverCenter(false);
    setHoverIndex(getIndexFromPoint(x, y));
  };

  const onHandlerStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state === State.BEGAN) {
      startRef.current = { x: e.nativeEvent.x, y: e.nativeEvent.y };
      const dx = e.nativeEvent.x - cx;
      const dy = e.nativeEvent.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist <= INNER_CANCEL_RADIUS) {
        setHoverCenter(true);
        setHoverIndex(null);
      } else {
        setHoverCenter(false);
        setHoverIndex(getIndexFromPoint(e.nativeEvent.x, e.nativeEvent.y));
      }
    } else if (
      e.nativeEvent.state === State.END ||
      e.nativeEvent.state === State.CANCELLED ||
      e.nativeEvent.state === State.FAILED
    ) {
      const endX = (startRef.current?.x ?? 0) + (e.nativeEvent.translationX ?? 0);
      const endY = (startRef.current?.y ?? 0) + (e.nativeEvent.translationY ?? 0);
      const dx = endX - cx;
      const dy = endY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist <= INNER_CANCEL_RADIUS) {
        startRef.current = null;
        setHoverIndex(null);
        setHoverCenter(false);
        onClose();
        return;
      }
      const idx = getIndexFromPoint(endX, endY);
      const chosen = OPTIONS[idx].key;
      startRef.current = null;
      setHoverIndex(null);
      setHoverCenter(false);
      onSelect(chosen);
    }
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback
        onPress={() => {
          // Ignore the initial tap that opened the menu
          if (openTimestamp && Date.now() - openTimestamp < 250) {
            return;
          }
          onClose();
        }}
      >
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {(() => {
            const size = RADIUS * 2;
            const centerSize = 72; // bigger, easier to hit
            return (
              <View
                style={[
                  styles.circle,
                  { left: cx - RADIUS, top: cy - RADIUS, width: size, height: size, borderRadius: RADIUS },
                ]}
              >
                {/* Cross dividers */}
                <View style={styles.vertLine} />
                <View style={styles.horzLine} />

                {/* Quadrants with icons */}
                <TouchableWithoutFeedback onPress={() => onSelect(OPTIONS[0].key)}>
                  <View style={[styles.quadrant, styles.topRight, hoverIndex === 0 && styles.quadrantActive]}>
                    <Icon name={OPTIONS[0].icon as any} size={18} color={hoverIndex === 0 ? colors.background.surface : colors.text.primary} />
                    <Text style={[styles.label, hoverIndex === 0 && styles.labelActive]}>{OPTIONS[0].label}</Text>
                  </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={() => onSelect(OPTIONS[1].key)}>
                  <View style={[styles.quadrant, styles.bottomRight, hoverIndex === 1 && styles.quadrantActive]}>
                    <Icon name={OPTIONS[1].icon as any} size={18} color={hoverIndex === 1 ? colors.background.surface : colors.text.primary} />
                    <Text style={[styles.label, hoverIndex === 1 && styles.labelActive]}>{OPTIONS[1].label}</Text>
                  </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={() => onSelect(OPTIONS[2].key)}>
                  <View style={[styles.quadrant, styles.bottomLeft, hoverIndex === 2 && styles.quadrantActive]}>
                    <Icon name={OPTIONS[2].icon as any} size={18} color={hoverIndex === 2 ? colors.background.surface : colors.text.primary} />
                    <Text style={[styles.label, hoverIndex === 2 && styles.labelActive]}>{OPTIONS[2].label}</Text>
                  </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={() => onSelect(OPTIONS[3].key)}>
                  <View style={[styles.quadrant, styles.topLeft, hoverIndex === 3 && styles.quadrantActive]}>
                    <Icon name={OPTIONS[3].icon as any} size={18} color={hoverIndex === 3 ? colors.background.surface : colors.text.primary} />
                    <Text style={[styles.label, hoverIndex === 3 && styles.labelActive]}>{OPTIONS[3].label}</Text>
                  </View>
                </TouchableWithoutFeedback>

                {/* Center cancel button with X */}
                <TouchableWithoutFeedback onPress={onClose}>
                  <View
                    style={[
                      styles.centerBtn,
                      { left: RADIUS - centerSize / 2, top: RADIUS - centerSize / 2, width: centerSize, height: centerSize, borderRadius: centerSize / 2 },
                    ]}
                  >
                    <Icon name="x" size={24} color={colors.text.primary} />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            );
          })()}
        </View>
      </PanGestureHandler>
    </View>
  );
};

export default QuickScheduleRadial;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  circle: {
    position: 'absolute',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.medium,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  vertLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: colors.border.medium,
    marginLeft: -0.5,
  },
  horzLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: colors.border.medium,
    marginTop: -0.5,
  },
  quadrant: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: colors.text.primary,
  },
  labelActive: {
    color: colors.background.surface,
  },
  quadrantActive: {
    backgroundColor: colors.primary,
  },
  topLeft: { left: 0, top: 0 },
  topRight: { right: 0, top: 0 },
  bottomRight: { right: 0, bottom: 0 },
  bottomLeft: { left: 0, bottom: 0 },
  centerBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    // Add shadow for prominence
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
});


