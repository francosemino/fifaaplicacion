import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Btn } from '../../src/ui';
import Avatar from '../../src/Avatar';

const FORMATS = [
  { key: 'F', label: 'Final (2)', slots: 2 },
  { key: 'SF', label: 'Semifinales (4)', slots: 4 },
  { key: 'QF', label: 'Cuartos (8)', slots: 8 },
];

export default function NewCup() {
  const router = useRouter();
  const { edition_id } = useLocalSearchParams<{ edition_id?: string }>();
  const [name, setName] = useState('');
  const [editionId, setEditionId] = useState<string | null>(edition_id || null);
  const [editions, setEditions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [format, setFormat] = useState('SF');

  const load = useCallback(async () => {
    const [ed, pl] = await Promise.all([api.listEditions(), api.listPlayers()]);
    setEditions(ed);
    setPlayers(pl);
    if (!editionId && ed[0]) setEditionId(ed[0].id);
  }, [editionId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = (pid: string) => {
    setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]));
  };

  const submit = async () => {
    if (!name.trim()) return Alert.alert('Nombre requerido');
    if (!editionId) return Alert.alert('Elegí edición');
    const slots = FORMATS.find((f) => f.key === format)!.slots;
    if (selected.length !== slots) {
      Alert.alert(`Elegí exactamente ${slots} jugadores`);
      return;
    }
    const c = await api.createCup({
      edition_id: editionId,
      name: name.trim(),
      participants: selected,
      format,
    });
    router.replace(`/cups/${c.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Nueva copa" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40, gap: 12 }}>
        <Text style={styles.label}>NOMBRE</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Copa Relámpago"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          testID="cup-name-input"
        />

        <Text style={styles.label}>EDICIÓN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {editions.map((e) => (
            <TouchableOpacity
              key={e.id}
              onPress={() => setEditionId(e.id)}
              style={[styles.chip, editionId === e.id && styles.chipActive]}
              testID={`cup-edition-${e.name}`}
            >
              <Text style={[styles.chipText, editionId === e.id && { color: '#0A0B0E' }]}>{e.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>FORMATO</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {FORMATS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFormat(f.key)}
              style={[styles.formatCard, format === f.key && styles.formatCardActive]}
              testID={`cup-format-${f.key}`}
            >
              <Text style={[styles.formatLabel, format === f.key && { color: '#0A0B0E' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>
          JUGADORES ({selected.length}/{FORMATS.find((f) => f.key === format)!.slots})
        </Text>
        <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, marginBottom: 8 }}>
          El orden de selección define los cruces (1 vs último, 2 vs anteúltimo…)
        </Text>
        {players.map((p) => {
          const idx = selected.indexOf(p.id);
          const isSel = idx >= 0;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.playerRow, isSel && { borderColor: colors.gold }]}
              onPress={() => toggle(p.id)}
              testID={`cup-select-${p.name}`}
            >
              <Avatar name={p.name} avatar={p.avatar_base64} size={36} />
              <Text style={styles.playerName}>{p.name}</Text>
              {isSel ? (
                <View style={styles.seedBadge}>
                  <Text style={styles.seedText}>#{idx + 1}</Text>
                </View>
              ) : (
                <Ionicons name="add-circle-outline" size={22} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}

        <Btn label="Crear copa" icon="checkmark" onPress={submit} testID="cup-create-submit" style={{ marginTop: 12 }} />
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
  formatCard: {
    flex: 1,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  formatCardActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  formatLabel: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 12 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md,
  },
  playerName: { color: colors.text, fontFamily: fonts.bodyBold, flex: 1, fontSize: 14 },
  seedBadge: { backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  seedText: { color: '#0A0B0E', fontFamily: fonts.headingBlack, fontSize: 12 },
});
