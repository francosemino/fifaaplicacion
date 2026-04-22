import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, requireAdmin } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Btn, Card } from '../../src/ui';
import Avatar from '../../src/Avatar';

export default function ChampionshipDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMatch, setAddMatch] = useState(false);
  const [editMatch, setEditMatch] = useState<any>(null);

  const load = useCallback(async () => {
    const [d, pls] = await Promise.all([api.getChampionship(id!), api.listPlayers()]);
    setData(d);
    setPlayers(pls);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pBy = (pid: string) => players.find((p) => p.id === pid);

  const finish = async () => {
    if (!requireAdmin()) return;
    if (window.confirm('¿Se declarará campeón al primero de la tabla?')) {
      try {
        await api.finishChampionship(id!);
        await load();
      } catch (e: any) {
        window.alert('Error: ' + e.message);
      }
    }
  };

  const remove = async () => {
    if (!requireAdmin()) return;
    if (window.confirm('Esto borra también todos sus partidos. ¿Seguro?')) {
      await api.deleteChampionship(id!);
      router.back();
    }
  };

  const deleteMatch = async (mid: string) => {
    if (!requireAdmin()) return;
    if (window.confirm('¿Seguro que querés eliminar este partido?')) {
      await api.deleteMatch(mid);
      await load();
    }
  };

  const openEditMatch = async (m: any) => {
    if (!requireAdmin()) return;
    setEditMatch(m);
  };

  if (loading || !data) {
    return <View style={styles.loader}><ActivityIndicator color={colors.gold} /></View>;
  }

  const { championship: c, standings, matches, awards } = data;
  const champ = c.champion_id ? pBy(c.champion_id) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={c.name}
        subtitle={c.status === 'finished' ? 'Finalizado' : 'En curso'}
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={remove} style={styles.delBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40, gap: 14 }}>
        {champ ? (
          <Card style={{ borderColor: colors.gold, borderWidth: 1.5, alignItems: 'center' }}>
            <Text style={styles.trophyLabel}>🏆 CAMPEÓN</Text>
            <Avatar name={champ.name} avatar={champ.avatar_base64} size={80} tier="gold" />
            <Text style={styles.champName}>{champ.name}</Text>
          </Card>
        ) : null}

        <Text style={styles.section}>Tabla</Text>
        <Card>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 30 }]}>#</Text>
            <Text style={[styles.th, { flex: 1 }]}>Jugador</Text>
            <Text style={styles.th}>PJ</Text>
            <Text style={styles.th}>G</Text>
            <Text style={styles.th}>E</Text>
            <Text style={styles.th}>P</Text>
            <Text style={styles.th}>DG</Text>
            <Text style={[styles.th, { color: colors.gold }]}>PTS</Text>
          </View>
          {standings.map((r: any, idx: number) => {
            const p = pBy(r.player_id);
            const tier = idx === 0 ? colors.gold : idx === 1 ? colors.silver : idx === 2 ? colors.bronze : colors.text;
            return (
              <View key={r.player_id} style={styles.tr}>
                <Text style={[styles.td, { width: 30, color: tier }]}>{idx + 1}</Text>
                <View style={[styles.td, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <Avatar name={p?.name || '?'} avatar={p?.avatar_base64} size={26} />
                  <Text style={{ color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 }} numberOfLines={1}>
                    {p?.name}
                  </Text>
                </View>
                <Text style={styles.td}>{r.played}</Text>
                <Text style={styles.td}>{r.won}</Text>
                <Text style={styles.td}>{r.drawn}</Text>
                <Text style={styles.td}>{r.lost}</Text>
                <Text style={styles.td}>{r.goal_diff >= 0 ? '+' : ''}{r.goal_diff}</Text>
                <Text style={[styles.td, { color: colors.gold, fontFamily: fonts.headingBlack }]}>{r.points}</Text>
              </View>
            );
          })}
        </Card>

        {matches.length > 0 ? (
          <>
            <Text style={styles.section}>Premios del torneo</Text>
            <View style={{ gap: 8 }}>
              {awards.top_scorer_id ? (
                <AwardRow icon="⚽" label="Mejor ataque" name={pBy(awards.top_scorer_id)?.name} color={colors.goldLight} />
              ) : null}
              {awards.best_defense_id ? (
                <AwardRow icon="🛡️" label="Mejor defensa" name={pBy(awards.best_defense_id)?.name} color={colors.silver} />
              ) : null}
              {awards.mvp_id ? (
                <AwardRow icon="⭐" label="MVP" name={pBy(awards.mvp_id)?.name} color={colors.gold} />
              ) : null}
              {awards.biggest_match ? (
                <AwardRow
                  icon="💥"
                  label={`Mayor goleada (${awards.biggest_match.match.goals1}-${awards.biggest_match.match.goals2})`}
                  name={`${pBy(awards.biggest_match.match.player1_id)?.name} vs ${pBy(awards.biggest_match.match.player2_id)?.name}`}
                  color={colors.danger}
                />
              ) : null}
            </View>
          </>
        ) : null}

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Partidos ({matches.length})</Text>
          {c.status !== 'finished' ? (
            <Btn label="Agregar" icon="add" onPress={() => setAddMatch(true)} testID="add-match-button" />
          ) : null}
        </View>
        {matches.length === 0 ? (
          <Text style={styles.empty}>Aún no hay partidos. Agregá el primero.</Text>
        ) : (
          matches.map((m: any) => {
            const p1 = pBy(m.player1_id);
            const p2 = pBy(m.player2_id);
            return (
              <View key={m.id} style={styles.matchCard}>
                <View style={{ flex: 1 }}>
                  <View style={styles.matchRow}>
                    <Text style={[styles.matchTeam, m.goals1 > m.goals2 && { color: colors.gold }]}>
                      {p1?.name}
                    </Text>
                    <Text style={styles.matchScore}>{m.goals1}</Text>
                  </View>
                  <View style={styles.matchRow}>
                    <Text style={[styles.matchTeam, m.goals2 > m.goals1 && { color: colors.gold }]}>
                      {p2?.name}
                    </Text>
                    <Text style={styles.matchScore}>{m.goals2}</Text>
                  </View>
                  {m.team1 || m.team2 ? (
                    <Text style={styles.matchMeta}>
                      {m.team1 || '?'} vs {m.team2 || '?'}
                      {m.round_name ? ` · ${m.round_name}` : ''}
                    </Text>
                  ) : m.round_name ? (
                    <Text style={styles.matchMeta}>{m.round_name}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => openEditMatch(m)} style={{ padding: 8 }}>
                  <Ionicons name="pencil-outline" size={16} color={colors.info} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteMatch(m.id)} style={{ padding: 8 }}>
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {c.status !== 'finished' && matches.length > 0 ? (
          <Btn label="Finalizar campeonato" icon="flag" onPress={finish} testID="finish-champ-button" variant="primary" />
        ) : null}
      </ScrollView>

      <AddMatchModal
        visible={addMatch}
        onClose={() => setAddMatch(false)}
        onDone={() => { setAddMatch(false); load(); }}
        participants={c.participants}
        players={players}
        competitionId={c.id}
      />

      {editMatch ? (
        <EditMatchModal
          visible={!!editMatch}
          match={editMatch}
          players={players}
          onClose={() => setEditMatch(null)}
          onDone={() => { setEditMatch(null); load(); }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function AwardRow({ icon, label, name, color }: { icon: string; label: string; name?: string; color: string }) {
  if (!name) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
        <Text style={{ color, fontFamily: fonts.headingBlack, fontSize: 15, marginTop: 2 }}>{name}</Text>
      </View>
    </View>
  );
}

function EditMatchModal({ visible, match, players, onClose, onDone }: any) {
  const [g1, setG1] = useState(String(match.goals1));
  const [g2, setG2] = useState(String(match.goals2));
  const [team1, setTeam1] = useState(match.team1 || '');
  const [team2, setTeam2] = useState(match.team2 || '');
  const [round, setRound] = useState(match.round_name || '');

  const pBy = (pid: string) => players.find((p: any) => p.id === pid);
  const p1 = pBy(match.player1_id);
  const p2 = pBy(match.player2_id);

  const submit = async () => {
    try {
      await api.deleteMatch(match.id);
      await api.createMatch({
        competition_id: match.competition_id,
        competition_type: match.competition_type,
        round_name: round || null,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        team1: team1 || null,
        team2: team2 || null,
        goals1: parseInt(g1) || 0,
        goals2: parseInt(g2) || 0,
      });
      onDone();
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.bg}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Editar partido</Text>
          <Text style={modalStyles.sub}>{p1?.name} vs {p2?.name}</Text>

          <Text style={modalStyles.label}>Fecha / Jornada</Text>
          <TextInput style={modalStyles.input} placeholder="Ej: Fecha 3" placeholderTextColor={colors.textMuted} value={round} onChangeText={setRound} />

          <Text style={modalStyles.label}>Equipo {p1?.name}</Text>
          <TextInput style={modalStyles.input} placeholder="Equipo local" placeholderTextColor={colors.textMuted} value={team1} onChangeText={setTeam1} />

          <Text style={modalStyles.label}>Equipo {p2?.name}</Text>
          <TextInput style={modalStyles.input} placeholder="Equipo visitante" placeholderTextColor={colors.textMuted} value={team2} onChangeText={setTeam2} />

          <Text style={modalStyles.label}>Resultado</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TextInput
              style={[modalStyles.input, { flex: 1, textAlign: 'center', fontSize: 28, fontFamily: fonts.headingBlack }]}
              keyboardType="numeric" value={g1} onChangeText={setG1}
            />
            <Text style={{ color: colors.textSecondary, fontFamily: fonts.headingBlack, fontSize: 22 }}>-</Text>
            <TextInput
              style={[modalStyles.input, { flex: 1, textAlign: 'center', fontSize: 28, fontFamily: fonts.headingBlack }]}
              keyboardType="numeric" value={g2} onChangeText={setG2}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Btn label="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Btn label="Guardar" onPress={submit} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AddMatchModal({ visible, onClose, onDone, participants, players, competitionId }: any) {
  const [p1, setP1] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);
  const [g1, setG1] = useState('0');
  const [g2, setG2] = useState('0');
  const [round, setRound] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');

  const reset = () => { setP1(null); setP2(null); setG1('0'); setG2('0'); setRound(''); setTeam1(''); setTeam2(''); };
  React.useEffect(() => { if (visible) reset(); }, [visible]);

  const pBy = (pid: string) => players.find((p: any) => p.id === pid);

  const submit = async () => {
    if (!p1 || !p2 || p1 === p2) { window.alert('Elegí dos jugadores distintos'); return; }
    try {
      await api.createMatch({
        competition_id: competitionId, competition_type: 'championship',
        round_name: round || null, player1_id: p1, player2_id: p2,
        team1: team1 || null, team2: team2 || null,
        goals1: parseInt(g1) || 0, goals2: parseInt(g2) || 0,
      });
      onDone();
    } catch (e: any) { window.alert('Error: ' + e.message); }
  };

  const selectP1 = (pid: string) => { setP1(pid); const t = participants.find((x: any) => x.player_id === pid)?.team_name; if (t) setTeam1(t); };
  const selectP2 = (pid: string) => { setP2(pid); const t = participants.find((x: any) => x.player_id === pid)?.team_name; if (t) setTeam2(t); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.bg}>
        <View style={modalStyles.card}>
          <ScrollView>
            <Text style={modalStyles.title}>Nuevo partido</Text>
            <Text style={modalStyles.label}>Fecha / Jornada (opcional)</Text>
            <TextInput style={modalStyles.input} placeholder="Ej: Fecha 3" placeholderTextColor={colors.textMuted} value={round} onChangeText={setRound} testID="match-round-input" />

            <Text style={modalStyles.label}>Local</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {participants.map((x: any) => {
                const p = pBy(x.player_id);
                if (!p) return null;
                return (
                  <TouchableOpacity key={x.player_id} onPress={() => selectP1(x.player_id)} style={[modalStyles.chip, p1 === x.player_id && modalStyles.chipActive]} testID={`match-p1-${p.name}`}>
                    <Avatar name={p.name} size={22} />
                    <Text style={[modalStyles.chipText, p1 === x.player_id && { color: '#0A0B0E' }]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput style={modalStyles.input} placeholder="Equipo local" placeholderTextColor={colors.textMuted} value={team1} onChangeText={setTeam1} />

            <Text style={modalStyles.label}>Visitante</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {participants.map((x: any) => {
                const p = pBy(x.player_id);
                if (!p || x.player_id === p1) return null;
                return (
                  <TouchableOpacity key={x.player_id} onPress={() => selectP2(x.player_id)} style={[modalStyles.chip, p2 === x.player_id && modalStyles.chipActive]} testID={`match-p2-${p.name}`}>
                    <Avatar name={p.name} size={22} />
                    <Text style={[modalStyles.chipText, p2 === x.player_id && { color: '#0A0B0E' }]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput style={modalStyles.input} placeholder="Equipo visitante" placeholderTextColor={colors.textMuted} value={team2} onChangeText={setTeam2} />

            <Text style={modalStyles.label}>Resultado</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput style={[modalStyles.input, { flex: 1, textAlign: 'center', fontSize: 22 }]} keyboardType="numeric" value={g1} onChangeText={setG1} testID="match-g1-input" />
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.headingBlack, fontSize: 22 }}>-</Text>
              <TextInput style={[modalStyles.input, { flex: 1, textAlign: 'center', fontSize: 22 }]} keyboardType="numeric" value={g2} onChangeText={setG2} testID="match-g2-input" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Btn label="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
              <Btn label="Guardar" onPress={submit} style={{ flex: 1 }} testID="match-save-submit" />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  delBtn: { width: 36, height: 36, backgroundColor: colors.surface, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  section: { color: colors.text, fontFamily: fonts.heading, fontSize: 15, marginTop: 6 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trophyLabel: { color: colors.gold, fontFamily: fonts.bodyBold, letterSpacing: 2, marginBottom: 10 },
  champName: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 26, marginTop: 10 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomColor: colors.border, borderBottomWidth: 1 },
  th: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, textAlign: 'center', width: 34, letterSpacing: 1 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomColor: colors.border, borderBottomWidth: 0.5 },
  td: { color: colors.text, fontFamily: fonts.body, fontSize: 12, textAlign: 'center', width: 34 },
  matchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 12 },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  matchScore: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 22 },
  matchMeta: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, marginTop: 4 },
  empty: { color: colors.textMuted, fontFamily: fonts.body, textAlign: 'center', padding: 12 },
});

const modalStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  title: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 22, marginBottom: 8 },
  sub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, marginBottom: 12 },
  label: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 12, color: colors.text, fontFamily: fonts.body, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 12 },
});
