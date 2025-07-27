import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const getIconName = (routeName: string) => {
    switch (routeName) {
      case 'AIChat':
        return '●';
      case 'Goals':
        return '▲';
      case 'Tasks':
        return '■';
      case 'Calendar':
        return '◆';
      default:
        return '●';
    }
  };

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 12) : 12,
        height: Platform.OS === 'android' ? 70 + Math.max(insets.bottom, 12) : 70,
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabIcon,
              { 
                backgroundColor: isFocused ? colors.primary : 'transparent',
                borderColor: isFocused ? colors.primary : colors.text.disabled,
                borderWidth: 1,
              }
            ]}>
              <Text style={[
                styles.tabIconText,
                { color: isFocused ? colors.secondary : colors.text.disabled }
              ]}>
                {getIconName(route.name)}
              </Text>
            </View>
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? colors.primary : colors.text.disabled }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 8,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabIconText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold as any,
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
}); 