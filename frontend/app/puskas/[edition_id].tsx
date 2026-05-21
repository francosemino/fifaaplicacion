import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Card } from '../../src/ui';
import Avatar from '../../src/Avatar';
import { VideoPlayerModal } from '../../src/GoalsSection';

export default function PuskasScreen() {
  const { edition_id } = useLocalSearchParams<{ edition_id: string }>();
  const id = edition_id;
  const router = useRouter();
  const [edition, setEdition] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [championships, setChampionships] = useState<any[]>([]);
  const [cups, setCups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playGoal, setPlayGoal] = useState<any | null>(null);

  const load = useCallback(async () => {
    const [eds, gs, pls, ch, cu] = await Promise.all([
      api.listEditions(),
      api.listGoals({ edition_id: id!, include_video: false }),
      api.listPlayers(),
      api.listChampionships(id!),
      api.listCups(id!),
    ]);
    setEdition(eds.find((e: any) => e.id === id));
    setGoals(gs);
    setPlayers(pls);
    setChampionships(ch);
    setCups(cu);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pBy = (pid: string) => players.find((p) => p.id === pid);
  const compName = (cid?: string | null) => {
    if (!cid) return '';
    return (
      championships.find((c) => c.id === cid)?.name ||
      cups.find((c) => c.id === cid)?.name ||
      ''
    );
  };

  const pickPuskas = (gid: string) => {
    Alert.alert(
      'Premio Puskas',
      '¿Marcar este como el mejor gol de la edición?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, es el Puskas',
          onPress: async () => {
            await api.markPuskas(gid);
            load();
          },
        },
      ]
    );
  };

  const openPlayer = async (g: any) => {
    const full = await api.getGoal(g.id);
    setPlayGoal(full);
  };

  if (loading || !edition) {
    return <View style={styles.loader}><ActivityIndicator color={colors.gold} /></View>;
  }

  const puskasWinner = goals.find((g) => g.is_puskas);
  const puskasPlayer = puskasWinner ? pBy(puskasWinner.player_id) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={`Premio Puskas ${edition.name}`}
        subtitle="El mejor gol de la edición"
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60, gap: 14 }}>
        {/* Winner card */}
        {puskasWinner && puskasPlayer ? (
          <Card style={{ borderColor: colors.gold, borderWidth: 1.5 }}>
            <Text style={styles.winnerLabel}>🏅 PUSKAS {edition.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
              <Avatar name={puskasPlayer.name} avatar={puskasPlayer.avatar_base64} size={70} tier="gold" />
              <View style={{ flex: 1 }}>
                <Text style={styles.winnerName}>{puskasPlayer.name}</Text>
                <Text style={styles.winnerTitle}>{puskasWinner.title}</Text>
                <Text style={styles.winnerMeta}>{compName(puskasWinner.competition_id)}</Text>
              </View>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => openPlayer(puskasWinner)}
                testID="play-puskas-winner"
              >
                <Ionicons name="play" size={22} color="#0A0B0E" />
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card style={{ alignItems: 'center', padding: spacing.lg }}>
            <Ionicons name="trophy-outline" size={36} color={colors.gold} />
            <Text style={styles.noPuskasTitle}>Aún no se eligió el Puskas</Text>
            <Text style={styles.noPuskasSub}>
              Elegí el mejor gol de toda la edición tocando el botón 🏅
            </Text>
          </Card>
        )}

        {/* All goals */}
        <Text style={styles.section}>
          Goles candidatos ({goals.length})
        </Text>
        {goals.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: spacing.lg }}>
            <Ionicons name="football-outline" size={32} color={colors.textMuted} />
            <Text style={styles.empty}>
              Aún no hay goles cargados en esta edición. Subí goles desde cada campeonato o copa.
            </Text>
          </Card>
        ) : (
          goals.map((g) => {
            const p = pBy(g.player_id);
            const isPuskas = g.is_puskas;
            return (
              <View
                key={g.id}
                style={[styles.goalCard, isPuskas && { borderColor: colors.gold, borderWidth: 1.5 }]}
                testID={`puskas-goal-${g.id}`}
              >
                <TouchableOpacity
                  style={styles.thumb}
                  onPress={() => openPlayer(g)}
                  testID={`puskas-play-${g.id}`}
                >
                  <Ionicons name="play-circle" size={36} color={colors.gold} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.goalTitle} numberOfLines={1}>{g.title}</Text>
                    {g.is_tournament_best ? (
                      <Ionicons name="trophy" size={14} color={colors.gold} />
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {p ? <Avatar name={p.name} avatar={p.avatar_base64} size={18} /> : null}
                    <Text style={styles.goalAuthor}>{p?.name}</Text>
                    {g.competition_id ? (
                      <Text style={styles.goalComp}>· {compName(g.competition_id)}</Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.puskasPick, isPuskas && { backgroundColor: colors.gold, borderColor: colors.gold }]}
                  onPress={() => pickPuskas(g.id)}
                  testID={`pick-puskas-${g.id}`}
                >
                  <Ionicons
                    name={isPuskas ? 'medal' : 'medal-outline'}
                    size={20}
                    color={isPuskas ? '#0A0B0E' : colors.gold}
                  />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <VideoPlayerModal visible={!!playGoal} onClose={() => setPlayGoal(null)} goal={playGoal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  winnerLabel: { color: colors.gold, fontFamily: fonts.bodyBold, letterSpacing: 2, fontSize: 11 },
  winnerName: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 22 },
  winnerTitle: { color: colors.text, fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  winnerMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 4 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  noPuskasTitle: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 17, marginTop: 8 },
  noPuskasSub: { color: colors.textSecondary, fontFamily: fonts.body, textAlign: 'center', marginTop: 4, fontSize: 12 },
  section: { color: colors.text, fontFamily: fonts.heading, fontSize: 15, marginTop: 4 },
  empty: { color: colors.textMuted, fontFamily: fonts.body, textAlign: 'center', marginTop: 8 },
  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md,
  },
  thumb: {
    width: 52, height: 52, backgroundColor: '#000', borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  goalTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13, flex: 1 },
  goalAuthor: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  goalComp: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11 },
  puskasPick: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
});
