import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { api } from '../src/api';
import { colors, fonts, radius, spacing } from '../src/theme';
import { ScreenHeader, Card } from '../src/ui';
import Avatar from '../src/Avatar';

export default function Rivalries() {
  const router = useRouter();
  const { p1: initP1, p2: initP2 } = useLocalSearchParams<{ p1?: string; p2?: string }>();
  const [players, setPlayers] = useState<any[]>([]);
  const [p1, setP1] = useState<string | null>(initP1 || null);
  const [p2, setP2] = useState<string | null>(initP2 || null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadPlayers = useCallback(async () => {
    const pl = await api.listPlayers();
    setPlayers(pl);
  }, []);
  useFocusEffect(useCallback(() => { loadPlayers(); }, [loadPlayers]));

  useEffect(() => {
    (async () => {
      if (p1 && p2 && p1 !== p2) {
        setLoading(true);
        const d = await api.head2head(p1, p2);
        setData(d);
        setLoading(false);
      } else {
        setData(null);
      }
    })();
  }, [p1, p2]);

  const pBy = (id: string) => players.find((p) => p.id === id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Rivalidad" subtitle="Head-to-head" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40, gap: 14 }}>
        <Text style={styles.label}>Jugador 1</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {players.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setP1(p.id)}
              style={[styles.chip, p1 === p.id && styles.chipActive]}
              testID={`riv-p1-${p.name}`}
            >
              <Avatar name={p.name} avatar={p.avatar_base64} size={28} />
              <Text style={[styles.chipText, p1 === p.id && { color: '#0A0B0E' }]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.label}>Jugador 2</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {players.filter((p) => p.id !== p1).map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setP2(p.id)}
              style={[styles.chip, p2 === p.id && styles.chipActive]}
              testID={`riv-p2-${p.name}`}
            >
              <Avatar name={p.name} avatar={p.avatar_base64} size={28} />
              <Text style={[styles.chipText, p2 === p.id && { color: '#0A0B0E' }]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} /> : null}

        {data && p1 && p2 ? (
          <>
            <Card style={{ padding: spacing.lg }}>
              <View style={styles.matchup}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Avatar name={pBy(p1)?.name || '?'} avatar={pBy(p1)?.avatar_base64} size={70} />
                  <Text style={styles.name}>{pBy(p1)?.name}</Text>
                  <Text style={styles.winCount}>{data.p1_wins}</Text>
                  <Text style={styles.lbl}>VICTORIAS</Text>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={styles.vs}>VS</Text>
                  <Text style={styles.drawsText}>{data.draws}</Text>
                  <Text style={styles.drawsLabel}>empates</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Avatar name={pBy(p2)?.name || '?'} avatar={pBy(p2)?.avatar_base64} size={70} />
                  <Text style={styles.name}>{pBy(p2)?.name}</Text>
                  <Text style={styles.winCount}>{data.p2_wins}</Text>
                  <Text style={styles.lbl}>VICTORIAS</Text>
                </View>
              </View>

              <View style={styles.goalRow}>
                <Text style={styles.goalSide}>
                  <Text style={{ color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 28 }}>{data.p1_goals}</Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.body }}> goles</Text>
                </Text>
                <Text style={styles.goalSide}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.body }}>goles </Text>
                  <Text style={{ color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 28 }}>{data.p2_goals}</Text>
                </Text>
              </View>

              <Text style={{ color: colors.textMuted, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, marginTop: 12 }}>
                {data.total} partido{data.total !== 1 ? 's' : ''} en total
              </Text>
            </Card>

            {/* Recent matches */}
            <Text style={styles.section}>Últimos partidos</Text>
            {data.matches.slice(0, 10).map((m: any) => (
              <View key={m.id} style={styles.matchRow}>
                <Text style={styles.matchName}>{pBy(m.player1_id)?.name}</Text>
                <Text style={styles.matchScore}>
                  {m.goals1} - {m.goals2}
                </Text>
                <Text style={[styles.matchName, { textAlign: 'right' }]}>{pBy(m.player2_id)?.name}</Text>
              </View>
            ))}
            {data.matches.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', fontFamily: fonts.body, padding: 12 }}>
                Aún no se enfrentaron
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  matchup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 16, marginTop: 8 },
  winCount: { color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 38, marginTop: 4 },
  lbl: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1 },
  vs: { color: colors.textMuted, fontFamily: fonts.headingBlack, fontSize: 20 },
  drawsText: { color: colors.textSecondary, fontFamily: fonts.headingBlack, fontSize: 22, marginTop: 6 },
  drawsLabel: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 10 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 14 },
  goalSide: { color: colors.text },
  section: { color: colors.text, fontFamily: fonts.heading, fontSize: 15, marginTop: 6 },
  matchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md,
  },
  matchName: { color: colors.text, fontFamily: fonts.body, fontSize: 13, flex: 1 },
  matchScore: { color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 16 },
});
