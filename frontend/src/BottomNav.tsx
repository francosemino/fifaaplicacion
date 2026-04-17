import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, radius } from './theme';

type Tab = 'home' | 'editions' | 'players' | 'history';

export default function BottomNav({ active }: { active: Tab }) {
  const router = useRouter();
  const items: { key: Tab; label: string; icon: any; path: string }[] = [
    { key: 'home', label: 'Inicio', icon: 'home', path: '/' },
    { key: 'editions', label: 'Ediciones', icon: 'game-controller', path: '/editions' },
    { key: 'players', label: 'Jugadores', icon: 'people', path: '/players' },
    { key: 'history', label: 'Historial', icon: 'time', path: '/history' },
  ];
  return (
    <View style={styles.wrap} testID="bottom-nav">
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <TouchableOpacity
            key={it.key}
            style={styles.item}
            onPress={() => router.push(it.path as any)}
            testID={`nav-${it.key}`}
          >
            <Ionicons
              name={it.icon}
              size={22}
              color={isActive ? colors.gold : colors.textSecondary}
            />
            <Text style={[styles.label, isActive && { color: colors.gold }]}>{it.label}</Text>
            {isActive ? <View style={styles.dot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingBottom: 22,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
    position: 'absolute',
    top: -4,
  },
});
