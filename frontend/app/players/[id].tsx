import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Card, StatBox, Pill } from '../../src/ui';
import Avatar from '../../src/Avatar';

export default function PlayerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [d, pls] = await Promise.all([api.playerProfile(id!), api.listPlayers()]);
    setData(d);
    setPlayers(pls);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = () => {
    Alert.alert('Eliminar jugador', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.deletePlayer(id!);
          router.back();
        },
      },
    ]);
  };

  if (loading || !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const { player, overall, by_edition, badges, championships_won, cups_won } = data;
  const pBy = (pid: string) => players.find((p) => p.id === pid);
  const rivals = Object.entries(overall.vs_rivals || {}) as [string, any][];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={player.name}
        subtitle={player.favorite_team || player.nickname || undefined}
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={confirmDelete} style={styles.delBtn} testID="delete-player">
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60, gap: 16 }}>
        {/* Header hero */}
        <View style={styles.heroRow}>
          <Avatar name={player.name} avatar={player.avatar_base64} size={110} tier={badges.find((b: any) => b.type === 'fifa_champion') ? 'gold' : null} />
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>{player.name}</Text>
            {player.nickname ? <Text style={styles.playerNick}>{player.nickname}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <Mini icon="🏆" label={`${overall.championships} camp.`} />
              <Mini icon="🥇" label={`${overall.cups} copas`} />
              <Mini icon="🎯" label={`${overall.win_pct}% WR`} />
            </View>
          </View>
        </View>

        {/* Badges */}
        {badges.length > 0 ? (
          <View>
            <Text style={styles.section}>Medallas e insignias</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {badges.map((b: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.badge,
                    {
                      borderColor:
                        b.tier === 'gold' ? colors.gold : b.tier === 'silver' ? colors.silver : colors.bronze,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>
                    {b.type === 'fifa_champion' ? '🏆' :
                      b.type === 'king_of_championships' ? '👑' :
                      b.type === 'king_of_cups' ? '🥇' :
                      b.type === 'top_scorer' ? '⚽' :
                      b.type === 'iron_wall' ? '🛡️' :
                      b.type === 'pecho_frio' ? '🥶' : '🏅'}
                  </Text>
                  <Text style={styles.badgeText}>{b.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Overall stats */}
        <Text style={styles.section}>Estadísticas generales</Text>
        <View style={{ gap: 8 }}>
          <View style={styles.statsRow}>
            <StatBox label="PJ" value={overall.played} />
            <StatBox label="PG" value={overall.won} color={colors.success} />
            <StatBox label="PE" value={overall.drawn} />
            <StatBox label="PP" value={overall.lost} color={colors.danger} />
          </View>
          <View style={styles.statsRow}>
            <StatBox label="GF" value={overall.goals_for} color={colors.goldLight} />
            <StatBox label="GC" value={overall.goals_against} />
            <StatBox
              label="DG"
              value={(overall.goal_diff >= 0 ? '+' : '') + overall.goal_diff}
              color={overall.goal_diff >= 0 ? colors.success : colors.danger}
            />
            <StatBox label="PROM" value={overall.avg_goals_per_match.toFixed(1)} />
          </View>
          <View style={styles.statsRow}>
            <StatBox label="Mejor racha" value={overall.best_win_streak} color={colors.gold} />
            <StatBox label="Peor racha" value={overall.worst_loss_streak} color={colors.danger} />
            <StatBox label="Puntos" value={overall.championship_points} color={colors.info} />
          </View>
        </View>

        {overall.biggest_win ? (
          <Card>
            <Text style={styles.cardLabel}>Mayor goleada a favor</Text>
            <Text style={styles.bigNumber}>{overall.biggest_win.score}</Text>
            <Text style={styles.cardMeta}>
              vs {pBy(overall.biggest_win.opponent_id)?.name || '?'}
            </Text>
          </Card>
        ) : null}

        {/* Por edición */}
        {by_edition.length > 0 ? (
          <>
            <Text style={styles.section}>Por edición</Text>
            {by_edition.map((e: any) => (
              <Card key={e.edition.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.edName}>{e.edition.name}</Text>
                  <Pill label={`${e.stats.championships} campeonatos`} color={colors.gold} />
                </View>
                <Text style={styles.edMeta}>
                  {e.stats.played} PJ · {e.stats.won}G · {e.stats.drawn}E · {e.stats.lost}P · GF {e.stats.goals_for} · GC {e.stats.goals_against} · {e.stats.cups} copas
                </Text>
              </Card>
            ))}
          </>
        ) : null}

        {/* Vs rivales */}
        {rivals.length > 0 ? (
          <>
            <Text style={styles.section}>Cara a cara</Text>
            <Card>
              {rivals.map(([rid, v]) => {
                const op = pBy(rid);
                if (!op) return null;
                return (
                  <TouchableOpacity
                    key={rid}
                    style={styles.rivalRow}
                    onPress={() => router.push(`/rivalries?p1=${id}&p2=${rid}`)}
                    testID={`rival-${op.name}`}
                  >
                    <Avatar name={op.name} avatar={op.avatar_base64} size={34} />
                    <Text style={styles.rivalName}>{op.name}</Text>
                    <Text style={styles.rivalScore}>
                      <Text style={{ color: colors.success }}>{v.won}</Text>
                      {' · '}
                      <Text style={{ color: colors.textSecondary }}>{v.drawn}</Text>
                      {' · '}
                      <Text style={{ color: colors.danger }}>{v.lost}</Text>
                    </Text>
                    <Text style={styles.rivalGoals}>
                      {v.gf}-{v.ga}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </>
        ) : null}

        {/* History */}
        {championships_won?.length > 0 ? (
          <>
            <Text style={styles.section}>Campeonatos ganados ({championships_won.length})</Text>
            {championships_won.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={styles.histCard}
                onPress={() => router.push(`/championships/${c.id}`)}
              >
                <Ionicons name="trophy" size={20} color={colors.gold} />
                <Text style={styles.histText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
        {cups_won?.length > 0 ? (
          <>
            <Text style={styles.section}>Copas ganadas ({cups_won.length})</Text>
            {cups_won.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={styles.histCard}
                onPress={() => router.push(`/cups/${c.id}`)}
              >
                <Ionicons name="medal" size={20} color={colors.silver} />
                <Text style={styles.histText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Mini({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  delBtn: {
    width: 36, height: 36, backgroundColor: colors.surface, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  playerName: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 28, letterSpacing: -0.5 },
  playerNick: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  section: { color: colors.text, fontFamily: fonts.heading, fontSize: 15, letterSpacing: 0.3, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  badge: {
    borderWidth: 1, borderRadius: radius.md, padding: 12, minWidth: 120,
    backgroundColor: colors.surface, alignItems: 'flex-start', gap: 4,
  },
  badgeText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 11 },
  cardLabel: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5 },
  bigNumber: { color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 42, marginTop: 4 },
  cardMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  edName: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 18 },
  edMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 8 },
  rivalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomColor: colors.border, borderBottomWidth: 0.5,
  },
  rivalName: { color: colors.text, fontFamily: fonts.bodyBold, flex: 1 },
  rivalScore: { fontFamily: fonts.bodyBold, fontSize: 13 },
  rivalGoals: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, width: 50, textAlign: 'right' },
  histCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md,
  },
  histText: { color: colors.text, fontFamily: fonts.body, fontSize: 14 },
});
