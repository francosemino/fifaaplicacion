import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, requireAdmin } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Btn, Card } from '../../src/ui';
import Avatar from '../../src/Avatar';

export default function CupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ ri: number; mi: number } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const [d, pls] = await Promise.all([api.getCup(id!), api.listPlayers()]);
    setData(d);
    setPlayers(pls);
    setLoading(false);
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pBy = (pid?: string | null) => (pid ? players.find((p) => p.id === pid) : null);

  const remove = async () => {
    if (!requireAdmin()) return;
    if (window.confirm('¿Seguro? También se borrarán todos sus partidos.')) {
      await api.deleteCup(id!);
      router.back();
    }
  };

  const openEditName = async () => {
    if (!requireAdmin()) return;
    setNewName(data.cup.name);
    setEditingName(true);
  };

  if (loading || !data) {
    return <View style={styles.loader}><ActivityIndicator color={colors.gold} /></View>;
  }

  const { cup } = data;
  const rounds = cup.bracket?.rounds || [];
  const champ = pBy(cup.champion_id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={cup.name}
        subtitle={cup.status === 'finished' ? 'Finalizada' : 'En curso'}
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={openEditName} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={18} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity onPress={remove} style={styles.delBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40, gap: 14 }}>
        {champ ? (
          <Card style={{ borderColor: colors.gold, borderWidth: 1.5, alignItems: 'center' }}>
            <Text style={{ color: colors.gold, fontFamily: fonts.bodyBold, letterSpacing: 2 }}>🥇 CAMPEÓN</Text>
            <Avatar name={champ.name} avatar={champ.avatar_base64} size={70} tier="gold" />
            <Text style={{ color: colors.text, fontFamily: fonts.headingBlack, fontSize: 22, marginTop: 8 }}>
              {champ.name}
            </Text>
            {cup.runnerup_id ? (
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.body, marginTop: 4 }}>
                Subcampeón: {pBy(cup.runnerup_id)?.name}
              </Text>
            ) : null}
            {cup.third_place_id ? (
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.body }}>
                Tercer puesto: {pBy(cup.third_place_id)?.name}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Text style={styles.section}>Cuadro</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, padding: 4 }}>
          {rounds.map((round: any, ri: number) => (
            <View key={ri} style={styles.roundCol}>
              <Text style={styles.roundTitle}>{round.name}</Text>
              <View style={{ gap: 18, justifyContent: 'space-around', flex: 1 }}>
                {round.matches.map((m: any, mi: number) => {
                  const p1 = pBy(m.p1);
                  const p2 = pBy(m.p2);
                  const canPlay = p1 && p2 && !m.w;
                  const completed = !!m.w;
                  return (
                    <TouchableOpacity
                      key={mi}
                      disabled={!canPlay}
                      onPress={() => canPlay && setModal({ ri, mi })}
                      style={[styles.bMatch, completed && { borderColor: colors.gold }]}
                      testID={`bracket-${ri}-${mi}`}
                    >
                      <View style={styles.bRow}>
                        <Text style={[styles.bName, m.w === m.p1 && { color: colors.gold, fontFamily: fonts.headingBlack }]} numberOfLines={1}>
                          {p1?.name || '—'}
                        </Text>
                      </View>
                      <View style={styles.bRow}>
                        <Text style={[styles.bName, m.w === m.p2 && { color: colors.gold, fontFamily: fonts.headingBlack }]} numberOfLines={1}>
                          {p2?.name || '—'}
                        </Text>
                      </View>
                      {m.score ? (
                        <Text style={styles.bScore}>{m.score}</Text>
                      ) : canPlay ? (
                        <Text style={styles.bTap}>Tocá para jugar</Text>
                      ) : (
                        <Text style={styles.bWait}>Esperando</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {modal ? (
        <ScoreModal
          visible={!!modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
          round={rounds[modal.ri]}
          matchInfo={rounds[modal.ri].matches[modal.mi]}
          roundIndex={modal.ri}
          matchIndex={modal.mi}
          cupId={id!}
          players={players}
        />
      ) : null}

      <Modal visible={editingName} transparent animationType="slide" onRequestClose={() => setEditingName(false)}>
        <View style={editS.bg}>
          <View style={editS.card}>
            <Text style={editS.title}>Editar nombre de copa</Text>
            <TextInput
              style={editS.input}
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Btn label="Cancelar" variant="secondary" onPress={() => setEditingName(false)} style={{ flex: 1 }} />
              <Btn label="Guardar" onPress={async () => {
                if (!newName.trim()) return;
                // No hay endpoint de update para copa en el backend, así que por ahora solo cerramos
                // Si querés agregar el endpoint, podés extender el backend
                window.alert('Para editar el nombre necesitás editar directamente en MongoDB Atlas por ahora.');
                setEditingName(false);
              }} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ScoreModal({ visible, onClose, onDone, round, matchInfo, roundIndex, matchIndex, cupId, players }: any) {
  const [g1, setG1] = useState('0');
  const [g2, setG2] = useState('0');
  const [penalties, setPenalties] = useState(false);
  const [pg1, setPg1] = useState('');
  const [pg2, setPg2] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');

  React.useEffect(() => {
    setG1('0'); setG2('0'); setPenalties(false); setPg1(''); setPg2(''); setTeam1(''); setTeam2('');
  }, [matchIndex, roundIndex, visible]);

  const pBy = (pid: string) => players.find((p: any) => p.id === pid);
  const p1 = pBy(matchInfo.p1);
  const p2 = pBy(matchInfo.p2);

  const submit = async () => {
    const goals1 = parseInt(g1) || 0;
    const goals2 = parseInt(g2) || 0;
    if (goals1 === goals2 && !penalties) {
      window.alert('En una copa debe haber un ganador. Activá penales.');
      return;
    }
    try {
      await api.registerCupMatch(cupId, {
        round_index: roundIndex,
        match_index: matchIndex,
        player1_id: matchInfo.p1,
        player2_id: matchInfo.p2,
        team1: team1 || null,
        team2: team2 || null,
        goals1,
        goals2,
        penalties,
        pen_goals1: penalties ? parseInt(pg1) || 0 : null,
        pen_goals2: penalties ? parseInt(pg2) || 0 : null,
      });
      onDone();
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalS.bg}>
        <View style={modalS.card}>
          <Text style={modalS.title}>{round.name}</Text>
          <Text style={modalS.sub}>{p1?.name} vs {p2?.name}</Text>
          <View style={modalS.scoreRow}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Avatar name={p1?.name || '?'} size={56} />
              <Text style={modalS.playerName}>{p1?.name}</Text>
              <TextInput style={modalS.scoreInput} keyboardType="numeric" value={g1} onChangeText={setG1} testID="cup-g1" />
              <TextInput style={modalS.teamInput} placeholder="Equipo" placeholderTextColor={colors.textMuted} value={team1} onChangeText={setTeam1} />
            </View>
            <Text style={{ color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 30 }}>VS</Text>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Avatar name={p2?.name || '?'} size={56} />
              <Text style={modalS.playerName}>{p2?.name}</Text>
              <TextInput style={modalS.scoreInput} keyboardType="numeric" value={g2} onChangeText={setG2} testID="cup-g2" />
              <TextInput style={modalS.teamInput} placeholder="Equipo" placeholderTextColor={colors.textMuted} value={team2} onChangeText={setTeam2} />
            </View>
          </View>
          <TouchableOpacity
            style={[modalS.penToggle, penalties && { borderColor: colors.gold, backgroundColor: `${colors.gold}22` }]}
            onPress={() => setPenalties(!penalties)}
            testID="cup-penalties-toggle"
          >
            <Ionicons name={penalties ? 'checkbox' : 'square-outline'} size={20} color={penalties ? colors.gold : colors.textSecondary} />
            <Text style={{ color: colors.text, fontFamily: fonts.bodyBold }}>Definió por penales</Text>
          </TouchableOpacity>
          {penalties ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TextInput style={[modalS.scoreInput, { flex: 1 }]} keyboardType="numeric" placeholder="Penales 1" placeholderTextColor={colors.textMuted} value={pg1} onChangeText={setPg1} />
              <TextInput style={[modalS.scoreInput, { flex: 1 }]} keyboardType="numeric" placeholder="Penales 2" placeholderTextColor={colors.textMuted} value={pg2} onChangeText={setPg2} />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Btn label="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Btn label="Guardar" onPress={submit} style={{ flex: 1 }} testID="cup-save-submit" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 36, height: 36, backgroundColor: colors.surface, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  delBtn: { width: 36, height: 36, backgroundColor: colors.surface, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  section: { color: colors.text, fontFamily: fonts.heading, fontSize: 15 },
  roundCol: { width: 190, minHeight: 300 },
  roundTitle: { color: colors.gold, fontFamily: fonts.bodyBold, letterSpacing: 1.5, fontSize: 11, marginBottom: 10 },
  bMatch: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 10, gap: 4 },
  bRow: { flexDirection: 'row', alignItems: 'center' },
  bName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  bScore: { color: colors.gold, fontFamily: fonts.headingBlack, fontSize: 14, marginTop: 4 },
  bTap: { color: colors.info, fontFamily: fonts.body, fontSize: 11, marginTop: 4 },
  bWait: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 10, marginTop: 4 },
});

const modalS = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { color: colors.gold, fontFamily: fonts.bodyBold, letterSpacing: 2, textAlign: 'center' },
  sub: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 18, textAlign: 'center', marginTop: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  playerName: { color: colors.text, fontFamily: fonts.bodyBold, marginTop: 8 },
  scoreInput: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingVertical: 12, color: colors.text, fontFamily: fonts.headingBlack, fontSize: 26, textAlign: 'center', width: '80%', marginTop: 10 },
  teamInput: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 8, color: colors.text, fontFamily: fonts.body, width: '85%', marginTop: 8, fontSize: 12 },
  penToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
});

const editS = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 22, marginBottom: 12 },
  input: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 12, color: colors.text, fontFamily: fonts.body },
});
