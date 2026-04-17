import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader } from '../../src/ui';
import Avatar from '../../src/Avatar';
import BottomNav from '../../src/BottomNav';

export default function PlayersList() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);

  const load = useCallback(async () => {
    const p = await api.listPlayers();
    setPlayers(p);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Jugadores"
        subtitle={`${players.length} registrados`}
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/players/new')}
            testID="add-player-button"
          >
            <Ionicons name="add" size={20} color="#0A0B0E" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120, gap: 10 }}>
        {players.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.row}
            onPress={() => router.push(`/players/${p.id}`)}
            testID={`player-row-${p.name}`}
          >
            <Avatar name={p.name} avatar={p.avatar_base64} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.name}</Text>
              {p.favorite_team ? (
                <Text style={styles.sub}>⚽ {p.favorite_team}</Text>
              ) : p.nickname ? (
                <Text style={styles.sub}>{p.nickname}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
        {players.length === 0 ? (
          <Text style={styles.empty}>Agregá jugadores para comenzar</Text>
        ) : null}
      </ScrollView>
      <BottomNav active="players" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  addBtn: {
    width: 36, height: 36, backgroundColor: colors.gold, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.lg,
  },
  name: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 17 },
  sub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  empty: { color: colors.textMuted, fontFamily: fonts.body, textAlign: 'center', padding: 20 },
});
