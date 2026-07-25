import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Btn, Card } from '../../src/ui';
import Avatar from '../../src/Avatar';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }

  return copy;
}

function parseTeams(text: string): string[] {
  return text
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function NewChampionship() {
  const router = useRouter();
  const { edition_id } = useLocalSearchParams<{ edition_id?: string }>();

  const [name, setName] = useState('');
  const [rounds, setRounds] = useState<'1' | '2'>('1');
  const [generateFixture, setGenerateFixture] = useState(true);
  const [editionId, setEditionId] = useState<string | null>(edition_id || null);
  const [editions, setEditions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [teamsText, setTeamsText] = useState('');
  const [selected, setSelected] = useState<Record<string, { selected: boolean; team: string }>>({});

  const selectedPlayers = useMemo(() => {
    return players.filter((p) => selected[p.id]?.selected);
  }, [players, selected]);

  const teams = useMemo(() => parseTeams(teamsText), [teamsText]);

  const load = useCallback(async () => {
    const [ed, pl] = await Promise.all([api.listEditions(), api.listPlayers()]);
    setEditions(ed);
    setPlayers(pl);
    if (!editionId && ed[0]) setEditionId(ed[0].id);
  }, [editionId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = (pid: string) => {
    setSelected((s) => ({
      ...s,
      [pid]: {
        selected: !s[pid]?.selected,
        team: s[pid]?.team || '',
      },
    }));
  };

  const setTeam = (pid: string, t: string) => {
    setSelected((s) => ({
      ...s,
      [pid]: {
        selected: true,
        team: t,
      },
    }));
  };

  const randomizeTeams = () => {
    if (selectedPlayers.length < 2) {
      Alert.alert('Elegí al menos 2 jugadores');
      return;
    }

    if (teams.length < selectedPlayers.length) {
      Alert.alert(
        'Faltan equipos',
        `Tenés ${selectedPlayers.length} jugadores seleccionados y solo ${teams.length} equipos cargados.`
      );
      return;
    }

    const shuffledTeams = shuffle(teams);
    const shuffledPlayers = shuffle(selectedPlayers);

    setSelected((current) => {
      const next = { ...current };

      shuffledPlayers.forEach((player, index) => {
        next[player.id] = {
          selected: true,
          team: shuffledTeams[index],
        };
      });

      return next;
    });
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido');
      return;
    }

    if (!editionId) {
      Alert.alert('Elegí una edición');
      return;
    }

    const parts = Object.entries(selected)
      .filter(([, v]) => v.selected)
      .map(([pid, v]) => ({
        player_id: pid,
        team_name: v.team.trim() || null,
      }));

    if (parts.length < 2) {
      Alert.alert('Elegí al menos 2 jugadores');
      return;
    }

    const missingTeams = parts.filter((p) => !p.team_name);

    if (missingTeams.length > 0) {
      const ok = window.confirm(
        'Hay jugadores sin equipo asignado. ¿Querés crear el campeonato igual?'
      );

      if (!ok) return;
    }

    try {
      const c = await api.createChampionship({
        edition_id: editionId,
        name: name.trim(),
        participants: parts,
        rounds: parseInt(rounds, 10),
        generate_fixture: generateFixture,
      });

      router.replace(`/championships/${c.id}`);
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Nuevo campeonato" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40, gap: 12 }}>
        <Text style={styles.label}>NOMBRE</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Liga de Verano"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          testID="champ-name"
        />

        <Text style={styles.label}>EDICIÓN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {editions.map((e) => (
            <TouchableOpacity
              key={e.id}
              onPress={() => setEditionId(e.id)}
              style={[styles.chip, editionId === e.id && styles.chipActive]}
              testID={`champ-edition-${e.name}`}
            >
              <Text style={[styles.chipText, editionId === e.id && { color: '#0A0B0E' }]}>
                {e.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>MODALIDAD</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setRounds('1')}
            style={[styles.modeBtn, rounds === '1' && styles.modeActive]}
          >
            <Ionicons name="arrow-forward" size={16} color={rounds === '1' ? '#0A0B0E' : colors.gold} />
            <Text style={[styles.modeText, rounds === '1' && { color: '#0A0B0E' }]}>Solo ida</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRounds('2')}
            style={[styles.modeBtn, rounds === '2' && styles.modeActive]}
          >
            <Ionicons name="swap-horizontal" size={16} color={rounds === '2' ? '#0A0B0E' : colors.gold} />
            <Text style={[styles.modeText, rounds === '2' && { color: '#0A0B0E' }]}>Ida y vuelta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setGenerateFixture((v) => !v)}
          style={[styles.fixtureToggle, generateFixture && { borderColor: colors.gold }]}
        >
          <View style={[styles.checkbox, generateFixture && { backgroundColor: colors.gold, borderColor: colors.gold }]}>
            {generateFixture ? <Ionicons name="checkmark" size={14} color="#0A0B0E" /> : null}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fixtureTitle}>Generar fixture automáticamente</Text>
            <Text style={styles.fixtureSub}>
              Crea todos los partidos del torneo como pendientes.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>PARTICIPANTES</Text>
        {players.map((p) => {
          const s = selected[p.id] || { selected: false, team: '' };

          return (
            <View key={p.id} style={styles.playerRow}>
              <TouchableOpacity
                onPress={() => toggle(p.id)}
                style={styles.playerToggle}
                testID={`champ-select-${p.name}`}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: s.selected ? colors.gold : colors.border,
                      backgroundColor: s.selected ? colors.gold : 'transparent',
                    },
                  ]}
                >
                  {s.selected ? <Ionicons name="checkmark" size={14} color="#0A0B0E" /> : null}
                </View>

                <Avatar name={p.name} avatar={p.avatar_base64} size={32} />

                <Text style={styles.playerName}>{p.name}</Text>
              </TouchableOpacity>

              {s.selected ? (
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 10, paddingVertical: 10 }]}
                  placeholder="Equipo"
                  placeholderTextColor={colors.textMuted}
                  value={s.team}
                  onChangeText={(t) => setTeam(p.id, t)}
                  testID={`champ-team-${p.name}`}
                />
              ) : null}
            </View>
          );
        })}

        <Card>
          <Text style={styles.cardTitle}>Sorteo de equipos</Text>
          <Text style={styles.cardSub}>
            Pegá los equipos separados por coma o uno debajo del otro. Después tocá sortear.
          </Text>

          <TextInput
            style={[styles.input, styles.teamsBox]}
            placeholder={`Ej:\nReal Madrid\nBarcelona\nManchester City\nLiverpool`}
            placeholderTextColor={colors.textMuted}
            value={teamsText}
            onChangeText={setTeamsText}
            multiline
          />

          <View style={styles.teamInfoRow}>
            <Text style={styles.teamInfo}>Jugadores: {selectedPlayers.length}</Text>
            <Text style={styles.teamInfo}>Equipos: {teams.length}</Text>
          </View>

          <Btn
            label="Sortear equipos"
            icon="shuffle"
            onPress={randomizeTeams}
            variant="secondary"
            testID="randomize-teams"
          />
        </Card>

        <Btn
          label={generateFixture ? 'Crear campeonato + fixture' : 'Crear campeonato'}
          icon="checkmark"
          onPress={submit}
          testID="champ-create-submit"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  chipText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  modeText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  fixtureToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  fixtureTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  fixtureSub: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 160,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.headingBlack,
    fontSize: 18,
  },
  cardSub: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  teamsBox: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  teamInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  teamInfo: {
    color: colors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});