import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from './theme';

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  testID,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.header} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            testID="back-button"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function Card({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

export function Pill({
  label,
  color = colors.gold,
  testID,
}: {
  label: string;
  color?: string;
  testID?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderColor: color,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}
      testID={testID}
    >
      <Text style={{ color, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function Btn({
  label,
  onPress,
  variant = 'primary',
  testID,
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  testID?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary'
      ? colors.gold
      : variant === 'secondary'
      ? 'transparent'
      : variant === 'danger'
      ? colors.danger
      : 'transparent';
  const textColor = variant === 'primary' ? '#0A0B0E' : variant === 'danger' ? '#fff' : colors.text;
  const border =
    variant === 'secondary' ? colors.border : variant === 'ghost' ? 'transparent' : bg;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
      <Text style={{ color: textColor, fontFamily: fonts.bodyBold, letterSpacing: 0.8 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function StatBox({
  label,
  value,
  color = colors.text,
  testID,
}: {
  label: string;
  value: string | number;
  color?: string;
  testID?: string;
}) {
  return (
    <View style={styles.statBox} testID={testID}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'trophy',
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ alignItems: 'center', padding: spacing.xl }}>
      <Ionicons name={icon} size={40} color={colors.textMuted} />
      <Text style={{ color: colors.text, fontFamily: fonts.heading, fontSize: 18, marginTop: 12 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: fonts.body,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    backgroundColor: colors.bg,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.headingBlack,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'flex-start',
    minWidth: 90,
  },
  statValue: {
    fontSize: 22,
    fontFamily: fonts.headingBlack,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
    marginTop: 4,
  },
});
