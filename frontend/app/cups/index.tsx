import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Pill } from '../../src/ui';

export default function CupsList() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [editions, setEditions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  const load = useCallback(async () => {
    const [c, ed, pl] = await Promise.all([api.listCups(), api.listEditions(), api.listPlayers()]);
    setItems(c);
    setEditions(ed);
    setPlayers(pl);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const edName = (id: string) => editions.find((e) => e.id === id)?.name || '';
  const pName = (id: string) => players.find((p) => p.id === id)?.name || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Copas"
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/cups/new')}
            testID="new-cup-button"
          >
            <Ionicons name="add" size={20} color="#0A0B0E" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40, gap: 10 }}>
        {items.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            onPress={() => router.push(`/cups/${c.id}`)}
            testID={`cup-row-${c.id}`}
          >
            <Ionicons name="medal" size={22} color={colors.silver} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{c.name}</Text>
              <Text style={styles.sub}>
                {edName(c.edition_id)} · {c.status === 'finished' ? `Ganó: ${pName(c.champion_id)}` : 'En curso'}
              </Text>
            </View>
            <Pill
              label={c.status === 'finished' ? 'Final' : 'Activa'}
              color={c.status === 'finished' ? colors.silver : colors.info}
            />
          </TouchableOpacity>
        ))}
        {items.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', fontFamily: fonts.body, padding: 20 }}>
            Aún no hay copas
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  addBtn: { width: 36, height: 36, backgroundColor: colors.gold, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md },
  title: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  sub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
});
