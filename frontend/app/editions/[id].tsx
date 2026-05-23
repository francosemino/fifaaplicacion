import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, requireAdmin } from '../../src/api';
import { VideoPlayerModal } from '../../src/GoalsSection';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Card, Pill, Btn } from '../../src/ui';
import Avatar from '../../src/Avatar';

export default function EditionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [champs, setChamps] = useState<any[]>([]);
  const [cups, setCups] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [puskasCandidates, setPuskasCandidates] = useState<any[]>([]);
  const [playGoal, setPlayGoal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, cs, cps, pls, goals] = await Promise.all([
      api.editionSummary(id!),
      api.listChampionships(id!),
      api.listCups(id!),
      api.listPlayers(),
      api.listGoals({
        edition_id: id!,
        is_tournament_best: true,
        include_video: false,
      }),
    ]);

    setSummary(s);
    setChamps(cs);
    setCups(cps);
    setPlayers(pls);
    setPuskasCandidates(goals);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !summary) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const pBy = (pid: string) => players.find((p) => p.id === pid);
  const bestPlayer = summary.best_player_id ? pBy(summary.best_player_id) : null;

  const openGoalVideo = async (goal: any) => {
    try {
      const full = await api.getGoal(goal.id);
      setPlayGoal(full);
    } catch (e: any) {
      window.alert('No se pudo abrir el video: ' + e.message);
    }
  };

  const togglePuskas = async (gid: string) => {
    if (!requireAdmin()) return;

    try {
      await api.markPuskas(gid);
      await load();
    } catch (e: any) {
      window.alert('No se pudo marcar el Puskas: ' + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={summary.edition.name}
        subtitle={summary.edition.year ? `Año ${summary.edition.year}` : undefined}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60, gap: 16 }}>
        {/* Campeón del FIFA */}
        {bestPlayer ? (
          <Card testID="champion-of-fifa" style={{ borderColor: colors.gold, borderWidth: 1.5 }}>
            <Text style={styles.badgeLabel}>🏆 CAMPEÓN DEL {summary.edition.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
              <Avatar name={bestPlayer.name} avatar={bestPlayer.avatar_base64} size={64} tier="gold" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bestName}>{bestPlayer.name}</Text>
                <Text style={styles.bestSub}>
                  Jugador con más campeonatos de esta edición
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <PuskasSection
          goals={puskasCandidates}
          players={players}
          onPlay={openGoalVideo}
          onMark={togglePuskas}
        />

        {/* Ranking */}
        <Text style={styles.section}>Ranking</Text>
        <Card>
          {(summary.ranking || []).map((r: any, idx: number) => {
            const p = pBy(r.player_id);
            if (!p) return null;
            const tier = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : null;
            return (
              <TouchableOpacity
                key={r.player_id}
                style={styles.rankRow}
                onPress={() => router.push(`/players/${r.player_id}`)}
                testID={`edition-rank-${idx}`}
              >
                <Text style={styles.pos}>#{idx + 1}</Text>
                <Avatar name={p.name} avatar={p.avatar_base64} size={40} tier={tier as any} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.rankMeta}>
                    🏆 {r.championships} · 🥇 {r.cups} · {r.championship_points} pts · DG {r.goal_diff >= 0 ? '+' : ''}{r.goal_diff}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Campeonatos */}
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Campeonatos ({champs.length})</Text>
          <Btn
            label="Nuevo"
            icon="add"
            onPress={() => router.push(`/championships/new?edition_id=${id}`)}
            testID="new-champ-in-edition"
          />
        </View>
        {champs.length === 0 ? (
          <Text style={styles.empty}>Aún no hay campeonatos en esta edición.</Text>
        ) : (
          champs.map((c) => {
            const champion = c.champion_id ? pBy(c.champion_id) : null;
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.tourCard}
                onPress={() => router.push(`/championships/${c.id}`)}
                testID={`champ-in-edition-${c.id}`}
              >
                <Ionicons name="trophy" size={22} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tourTitle}>{c.name}</Text>
                  <Text style={styles.tourMeta}>
                    {c.status === 'finished' && champion
                      ? `Campeón: ${champion.name}`
                      : 'En curso'}
                  </Text>
                </View>
                <Pill
                  label={c.status === 'finished' ? 'Finalizado' : 'En juego'}
                  color={c.status === 'finished' ? colors.gold : colors.info}
                />
              </TouchableOpacity>
            );
          })
        )}

        {/* Copas */}
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Copas ({cups.length})</Text>
          <Btn
            label="Nueva"
            icon="add"
            onPress={() => router.push(`/cups/new?edition_id=${id}`)}
            testID="new-cup-in-edition"
          />
        </View>
        {cups.length === 0 ? (
          <Text style={styles.empty}>Aún no hay copas en esta edición.</Text>
        ) : (
          cups.map((c) => {
            const champion = c.champion_id ? pBy(c.champion_id) : null;
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.tourCard}
                onPress={() => router.push(`/cups/${c.id}`)}
                testID={`cup-in-edition-${c.id}`}
              >
                <Ionicons name="medal" size={22} color={colors.silver} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tourTitle}>{c.name}</Text>
                  <Text style={styles.tourMeta}>
                    {c.status === 'finished' && champion
                      ? `Ganador: ${champion.name}`
                      : 'En curso'}
                  </Text>
                </View>
                <Pill
                  label={c.status === 'finished' ? 'Finalizado' : 'En juego'}
                  color={c.status === 'finished' ? colors.silver : colors.info}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <VideoPlayerModal
        visible={!!playGoal}
        onClose={() => setPlayGoal(null)}
        goal={playGoal}
      />
    </SafeAreaView>
  );
}

function PuskasSection({
    goals,
    players,
    onPlay,
    onMark,
  }: {
    goals: any[];
    players: any[];
    onPlay: (goal: any) => void;
    onMark: (gid: string) => void;
  }) {
    const pBy = (pid: string) => players.find((p) => p.id === pid);

    return (
      <>
        <Text style={styles.section}>Premio Puskas de la edición</Text>

        <Card style={{ borderColor: goals.some((g) => g.is_puskas) ? colors.gold : colors.border, borderWidth: 1 }}>
          <Text style={styles.puskasHelp}>
            Acá aparecen solo los goles que marcaste como “mejor gol del torneo” dentro de cada campeonato o copa.
          </Text>

          {goals.length === 0 ? (
            <Text style={styles.empty}>
              Todavía no hay candidatos. Entrá a un torneo o copa y marcá un gol con el trofeo.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {goals.map((g) => {
                const p = pBy(g.player_id);

                return (
                  <View
                    key={g.id}
                    style={[styles.puskasCard, g.is_puskas && { borderColor: colors.gold, borderWidth: 1.5 }]}
                  >
                    <TouchableOpacity
                      style={styles.puskasPlay}
                      onPress={() => onPlay(g)}
                      disabled={!g.has_video}
                    >
                      <Ionicons
                        name={g.has_video ? 'play-circle' : 'film-outline'}
                        size={30}
                        color={g.has_video ? colors.gold : colors.textMuted}
                      />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.puskasTitle} numberOfLines={1}>
                          {g.title}
                        </Text>

                        {g.is_puskas ? (
                          <Text style={styles.puskasTag}>PUSKAS</Text>
                        ) : null}
                      </View>

                      <Text style={styles.puskasMeta}>
                        {p?.name || 'Sin jugador'} · {g.competition_type === 'cup' ? 'Copa' : 'Campeonato'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => onMark(g.id)}
                      style={[styles.puskasBtn, g.is_puskas && { backgroundColor: colors.gold, borderColor: colors.gold }]}
                    >
                      <Ionicons
                        name="star"
                        size={18}
                        color={g.is_puskas ? '#0A0B0E' : colors.gold}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </>
    );
  }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  section: { color: colors.text, fontFamily: fonts.heading, fontSize: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeLabel: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2 },
  bestName: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 24 },
  bestSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomColor: colors.border, borderBottomWidth: 0.5,
  },
  pos: { color: colors.textSecondary, fontFamily: fonts.headingBlack, fontSize: 14, width: 28 },
  name: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 15 },
  rankMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  tourCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md,
  },
  tourTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  tourMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  empty: { color: colors.textMuted, fontFamily: fonts.body, textAlign: 'center', padding: 8 },
  puskasHelp: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: 12,
  },
  puskasCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  puskasPlay: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: '#000',
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puskasTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    flex: 1,
  },
  puskasMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 3,
  },
  puskasTag: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  puskasBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
