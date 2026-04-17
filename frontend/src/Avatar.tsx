import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, radius, avatarPalette, fonts } from './theme';

type Props = {
  name?: string;
  avatar?: string | null;
  size?: number;
  tier?: 'gold' | 'silver' | 'bronze' | null;
};

/** Stable index from name */
function hashIdx(name: string, len: number) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % len;
}

export default function Avatar({ name = '?', avatar, size = 48, tier = null }: Props) {
  const initials = name
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const bg = avatarPalette[hashIdx(name, avatarPalette.length)];
  const borderColor =
    tier === 'gold' ? colors.gold : tier === 'silver' ? colors.silver : tier === 'bronze' ? colors.bronze : 'transparent';
  const borderWidth = tier ? 2 : 0;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius.lg,
          backgroundColor: bg,
          borderColor,
          borderWidth,
        },
      ]}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar.startsWith('data:') ? avatar : `data:image/jpeg;base64,${avatar}` }}
          style={{ width: size, height: size, borderRadius: radius.lg }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#0A0B0E',
    fontFamily: fonts.headingBlack,
    letterSpacing: 0,
  },
});
