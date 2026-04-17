import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api';
import { colors, fonts, radius, spacing } from '../src/theme';
import Avatar from '../src/Avatar';
import { Card, Pill, StatBox } from '../src/ui';
import BottomNav from '../src/BottomNav';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, pls] = await Promise.all([api.dashboard(), api.listPlayers()]);
      setData(d);
      setPlayers(pls);
    } catch (e) {
      console.log('dashboard error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const playerById = (id: string) => players.find((p) => p.id === id);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const seedIfEmpty = async () => {
    await api.seed();
    await load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.gold}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero} testID="dashboard-hero">
          <Text style={styles.heroLabel}>FC TROPHY TRACKER</Text>
          <Text style={styles.heroTitle}>Torneos entre amigos</Text>
          <Text style={styles.heroSubtitle}>
            Registrá, rankea y celebrá cada copa y liga.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox
            label="Jugadores"
            value={data?.players_count || 0}
            color={colors.gold}
            testID="stat-players"
          />
          <StatBox
            label="Ediciones"
            value={data?.editions_count || 0}
            color={colors.info}
            testID="stat-editions"
          />
        </View>
        <View style={styles.statsRow}>
          <StatBox
            label="Campeonatos"
            value={data?.championships_count || 0}
            color={colors.goldLight}
            testID="stat-champs"
          />
          <StatBox
            label="Copas"
            value={data?.cups_count || 0}
            color={colors.silver}
            testID="stat-cups"
          />
          <StatBox
            label="Partidos"
            value={data?.matches_count || 0}
            color={colors.success}
            testID="stat-matches"
          />
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickRow}>
          <QuickAction
            icon="trophy"
            label="Nuevo campeonato"
            color={colors.gold}
            onPress={() => router.push('/championships/new')}
            testID="quick-new-championship"
          />
          <QuickAction
            icon="podium"
            label="Nueva copa"
            color={colors.silver}
            onPress={() => router.push('/cups/new')}
            testID="quick-new-cup"
          />
        </View>
        <View style={styles.quickRow}>
          <QuickAction
            icon="person-add"
            label="Nuevo jugador"
            color={colors.info}
            onPress={() => router.push('/players/new')}
            testID="quick-new-player"
          />
          <QuickAction
            icon="git-compare"
            label="Rivalidad"
            color={colors.success}
            onPress={() => router.push('/rivalries')}
            testID="quick-rivalries"
          />
        </View>

        {/* Top ranking */}
        <Text style={styles.sectionTitle}>Ranking histórico</Text>
        <Card testID="top-ranking-card">
          {(data?.top_ranking || []).length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.body }}>
                Aún no hay datos. 
              </Text>
              <TouchableOpacity
                onPress={seedIfEmpty}
                style={{
                  marginTop: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: colors.gold,
                  borderRadius: radius.md,
                }}
                testID="seed-button"
              >
                <Text style={{ color: '#0A0B0E', fontFamily: fonts.bodyBold }}>
                  Cargar datos demo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            (data?.top_ranking || []).map((r: any, idx: number) => {
              const p = playerById(r.player_id);
              if (!p) return null;
              const tier = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : null;
              return (
                <TouchableOpacity
                  key={r.player_id}
                  onPress={() => router.push(`/players/${r.player_id}`)}
                  style={styles.rankRow}
                  testID={`ranking-row-${idx}`}
                >
                  <Text style={[styles.rankPos, tier && { color: (tier === 'gold' ? colors.gold : tier === 'silver' ? colors.silver : colors.bronze) }]}>
                    #{idx + 1}
                  </Text>
                  <Avatar name={p.name} avatar={p.avatar_base64} size={42} tier={tier as any} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankName}>{p.name}</Text>
                    <Text style={styles.rankMeta}>
                      🏆 {r.championships} · 🥇 {r.cups} · +{r.championship_points} pts
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </Card>

        {/* Editions */}
        <Text style={styles.sectionTitle}>Ediciones</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
        >
          {(data?.editions || []).map((ed: any) => (
            <TouchableOpacity
              key={ed.id}
              onPress={() => router.push(`/editions/${ed.id}`)}
              style={styles.editionCard}
              testID={`edition-card-${ed.name}`}
            >
              <Ionicons name="game-controller" size={28} color={colors.gold} />
              <Text style={styles.editionName}>{ed.name}</Text>
              {ed.year ? <Text style={styles.editionYear}>{ed.year}</Text> : null}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.push('/editions')}
            style={[styles.editionCard, { borderStyle: 'dashed' }]}
            testID="manage-editions-card"
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
            <Text style={[styles.editionName, { color: colors.textSecondary }]}>Gestionar</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Recent champions */}
        <Text style={styles.sectionTitle}>Últimos campeones</Text>
        <View style={{ paddingHorizontal: spacing.md, gap: 10 }}>
          {(data?.recent_champions || []).slice(0, 3).map((c: any) => {
            const p = playerById(c.champion_id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => router.push(`/championships/${c.id}`)}
                style={styles.recentRow}
                testID={`recent-champ-${c.id}`}
              >
                <Ionicons name="trophy" size={22} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{c.name}</Text>
                  <Text style={styles.recentMeta}>Campeón: {p?.name || 'N/A'}</Text>
                </View>
                <Pill label="Liga" color={colors.gold} />
              </TouchableOpacity>
            );
          })}
          {(data?.recent_cups || []).slice(0, 2).map((c: any) => {
            const p = playerById(c.champion_id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => router.push(`/cups/${c.id}`)}
                style={styles.recentRow}
                testID={`recent-cup-${c.id}`}
              >
                <Ionicons name="medal" size={22} color={colors.silver} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{c.name}</Text>
                  <Text style={styles.recentMeta}>Ganador: {p?.name || 'N/A'}</Text>
                </View>
                <Pill label="Copa" color={colors.silver} />
              </TouchableOpacity>
            );
          })}
          {(data?.recent_champions || []).length === 0 &&
            (data?.recent_cups || []).length === 0 && (
              <Text
                style={{
                  color: colors.textMuted,
                  fontFamily: fonts.body,
                  textAlign: 'center',
                  padding: 16,
                }}
              >
                Aún no hay torneos finalizados.
              </Text>
            )}
        </View>
      </ScrollView>
      <BottomNav active="home" />
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
  testID,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} testID={testID}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}22`, borderColor: color }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  hero: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  heroLabel: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    letterSpacing: 3,
    fontSize: 11,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.headingBlack,
    fontSize: 34,
    letterSpacing: -1,
    marginTop: 4,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: 0.3,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginBottom: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickLabel: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  editionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    width: 130,
    alignItems: 'flex-start',
    gap: 4,
  },
  editionName: {
    color: colors.text,
    fontFamily: fonts.headingBlack,
    fontSize: 18,
    marginTop: 8,
  },
  editionYear: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomColor: colors.border,
    borderBottomWidth: 0.5,
  },
  rankPos: {
    color: colors.textSecondary,
    fontFamily: fonts.headingBlack,
    fontSize: 16,
    width: 36,
  },
  rankName: {
    color: colors.text,
    fontFamily: fonts.headingBlack,
    fontSize: 16,
  },
  rankMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  recentTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  recentMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
});
