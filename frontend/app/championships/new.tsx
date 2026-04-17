import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Btn } from '../../src/ui';
import Avatar from '../../src/Avatar';

export default function NewChampionship() {
  const router = useRouter();
  const { edition_id } = useLocalSearchParams<{ edition_id?: string }>();
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState('2');
  const [editionId, setEditionId] = useState<string | null>(edition_id || null);
  const [editions, setEditions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, { selected: boolean; team: string }>>({});

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
      [pid]: { selected: !s[pid]?.selected, team: s[pid]?.team || '' },
    }));
  };

  const setTeam = (pid: string, t: string) => {
    setSelected((s) => ({ ...s, [pid]: { selected: true, team: t } }));
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
      .map(([pid, v]) => ({ player_id: pid, team_name: v.team.trim() || null }));
    if (parts.length < 2) {
      Alert.alert('Elegí al menos 2 jugadores');
      return;
    }
    const c = await api.createChampionship({
      edition_id: editionId,
      name: name.trim(),
      participants: parts,
      rounds: parseInt(rounds) || 1,
    });
    router.replace(`/championships/${c.id}`);
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

        <Text style={styles.label}>VUELTAS (CUÁNTAS VECES SE ENFRENTAN)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={rounds}
          onChangeText={setRounds}
          testID="champ-rounds"
        />

        <Text style={styles.label}>PARTICIPANTES Y EQUIPOS</Text>
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
                    { borderColor: s.selected ? colors.gold : colors.border, backgroundColor: s.selected ? colors.gold : 'transparent' },
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

        <Btn label="Crear campeonato" icon="checkmark" onPress={submit} testID="champ-create-submit" style={{ marginTop: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, marginTop: 6 },
  input: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: 14, color: colors.text, fontFamily: fonts.body, fontSize: 15,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  playerToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 160 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  playerName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
});
