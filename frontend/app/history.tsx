import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api';
import { colors, fonts, radius, spacing } from '../src/theme';
import { ScreenHeader, Card } from '../src/ui';
import Avatar from '../src/Avatar';
import BottomNav from '../src/BottomNav';

export default function History() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [rankings, setRankings] = useState<any>(null);
  const [tab, setTab] = useState<'campeones' | 'records' | 'ranks'>('campeones');

  const load = useCallback(async () => {
    const [h, r] = await Promise.all([api.history(), api.rankings()]);
    setData(h);
    setRankings(r);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!data) {
    return <View style={styles.loader}><ActivityIndicator color={colors.gold} /></View>;
  }

  const pBy = (id?: string | null) => (id ? data.players.find((p: any) => p.id === id) : null);
  const edBy = (id: string) => data.editions.find((e: any) => e.id === id)?.name || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Historial" subtitle="Campeones, récords y rankings" onBack={() => router.back()} />

      <View style={styles.tabs}>
        {(['campeones', 'records', 'ranks'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
            testID={`history-tab-${t}`}
          >
            <Text style={[styles.tabText, tab === t && { color: '#0A0B0E' }]}>
              {t === 'campeones' ? 'Campeones' : t === 'records' ? 'Récords' : 'Rankings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120, gap: 14 }}>
        {tab === 'campeones' ? (
          <>
            <Text style={styles.section}>Campeonatos</Text>
            {data.championships.filter((c: any) => c.champion_id).map((c: any) => (
              <TouchableOpacity key={c.id} style={styles.card} onPress={() => router.push(`/championships/${c.id}`)}>
                <Ionicons name="trophy" size={20} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Text style={styles.cardMeta}>
                    {edBy(c.edition_id)} · Campeón: {pBy(c.champion_id)?.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            <Text style={styles.section}>Copas</Text>
            {data.cups.filter((c: any) => c.champion_id).map((c: any) => (
              <TouchableOpacity key={c.id} style={styles.card} onPress={() => router.push(`/cups/${c.id}`)}>
                <Ionicons name="medal" size={20} color={colors.silver} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Text style={styles.cardMeta}>
                    {edBy(c.edition_id)} · Ganador: {pBy(c.champion_id)?.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        ) : tab === 'records' ? (
          <>
            {data.records?.biggest_win ? (
              <Card>
                <Text style={styles.recLabel}>MAYOR GOLEADA</Text>
                <Text style={styles.recScore}>
                  {data.records.biggest_win.match.goals1}-{data.records.biggest_win.match.goals2}
                </Text>
                <Text style={styles.recPlayers}>
                  {pBy(data.records.biggest_win.match.player1_id)?.name} vs {pBy(data.records.biggest_win.match.player2_id)?.name}
                </Text>
              </Card>
            ) : null}
            {data.records?.highest_scoring ? (
              <Card>
                <Text style={styles.recLabel}>PARTIDO CON MÁS GOLES</Text>
                <Text style={styles.recScore}>
                  {data.records.highest_scoring.match.goals1}-{data.records.highest_scoring.match.goals2} ({data.records.highest_scoring.total})
                </Text>
                <Text style={styles.recPlayers}>
                  {pBy(data.records.highest_scoring.match.player1_id)?.name} vs {pBy(data.records.highest_scoring.match.player2_id)?.name}
                </Text>
              </Card>
            ) : null}
            {!data.records?.biggest_win && !data.records?.highest_scoring ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 20, fontFamily: fonts.body }}>
                Aún no hay partidos registrados
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <RankSection title="Ranking general" data={rankings?.general || []} kind="general" pBy={pBy} router={router} />
            <RankSection title="Goleadores" data={rankings?.offensive || []} kind="offensive" pBy={pBy} router={router} />
            <RankSection title="Defensas" data={rankings?.defensive || []} kind="defensive" pBy={pBy} router={router} />
            <RankSection title="Efectividad" data={rankings?.effective || []} kind="effective" pBy={pBy} router={router} />
          </>
        )}
      </ScrollView>
      <BottomNav active="history" />
    </SafeAreaView>
  );
}

function RankSection({ title, data, kind, pBy, router }: any) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.section}>{title}</Text>
      <Card>
        {data.slice(0, 8).map((r: any, idx: number) => {
          const p = pBy(r.player_id);
          if (!p) return null;
          let sub = '';
          if (kind === 'general') sub = `🏆 ${r.championships} · 🥇 ${r.cups} · ${r.championship_points} pts`;
          else if (kind === 'offensive') sub = `${r.goals_for} goles · ${r.avg_goals_per_match.toFixed(2)} p/p`;
          else if (kind === 'defensive') sub = `${r.goals_against} recibidos en ${r.played} PJ`;
          else if (kind === 'effective') sub = `${r.win_pct}% · ${r.won}G en ${r.played} PJ`;
          const tier = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : null;
          return (
            <TouchableOpacity
              key={r.player_id}
              style={styles.rankRow}
              onPress={() => router.push(`/players/${r.player_id}`)}
              testID={`history-rank-${kind}-${idx}`}
            >
              <Text style={[styles.rankPos, tier && { color: tier === 'gold' ? colors.gold : tier === 'silver' ? colors.silver : colors.bronze }]}>
                #{idx + 1}
              </Text>
              <Avatar name={p.name} avatar={p.avatar_base64} size={36} tier={tier as any} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rankName}>{p.name}</Text>
                <Text style={styles.rankSub}>{sub}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: 8, padding: spacing.md },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tabText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 12 },
  section: { color: colors.text, fontFamily: fonts.heading, fontSize: 15, marginTop: 6 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md,
  },
  cardTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  cardMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  recLabel: { color: colors.textMuted, fontFamily: fonts.bodyBold, letterSpacing: 1.5, fontSize: 11 },
  recScore: { color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 34, marginTop: 4 },
  recPlayers: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, marginTop: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomColor: colors.border, borderBottomWidth: 0.5 },
  rankPos: { color: colors.textSecondary, fontFamily: fonts.headingBlack, fontSize: 13, width: 28 },
  rankName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  rankSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
});
