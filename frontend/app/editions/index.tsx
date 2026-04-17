import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Btn } from '../../src/ui';
import BottomNav from '../../src/BottomNav';

export default function EditionsList() {
  const router = useRouter();
  const [editions, setEditions] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [year, setYear] = useState('');

  const load = useCallback(async () => {
    const e = await api.listEditions();
    setEditions(e);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createEd = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido');
      return;
    }
    await api.createEdition({ name: name.trim(), year: year ? parseInt(year) : null });
    setModalOpen(false);
    setName('');
    setYear('');
    load();
  };

  const delEd = (id: string, n: string) => {
    Alert.alert('Eliminar edición', `¿Seguro querés eliminar ${n}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.deleteEdition(id);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Ediciones"
        subtitle="FC 25, FC 26, FC 27..."
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalOpen(true)}
            testID="add-edition-button"
          >
            <Ionicons name="add" size={20} color="#0A0B0E" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120, gap: 12 }}>
        {editions.map((ed) => (
          <TouchableOpacity
            key={ed.id}
            style={styles.card}
            onPress={() => router.push(`/editions/${ed.id}`)}
            testID={`edition-${ed.name}`}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="game-controller" size={26} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{ed.name}</Text>
              {ed.year ? <Text style={styles.cardSub}>Año {ed.year}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => delEd(ed.id, ed.name)} style={styles.delBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
        {editions.length === 0 ? (
          <Text style={styles.empty}>Aún no hay ediciones. Agregá FC 25 o FC 26.</Text>
        ) : null}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva edición</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre (ej: FC 27)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              testID="edition-name-input"
            />
            <TextInput
              style={styles.input}
              placeholder="Año (opcional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={year}
              onChangeText={setYear}
              testID="edition-year-input"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Btn label="Cancelar" variant="secondary" onPress={() => setModalOpen(false)} style={{ flex: 1 }} />
              <Btn label="Crear" onPress={createEd} style={{ flex: 1 }} testID="create-edition-submit" />
            </View>
          </View>
        </View>
      </Modal>
      <BottomNav active="editions" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  addBtn: {
    width: 36, height: 36, backgroundColor: colors.gold, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  iconWrap: {
    width: 50, height: 50, borderRadius: radius.md,
    backgroundColor: `${colors.gold}22`,
    borderWidth: 1, borderColor: `${colors.gold}55`,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 20 },
  cardSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  delBtn: { padding: 8 },
  empty: { color: colors.textMuted, fontFamily: fonts.body, textAlign: 'center', padding: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 20, marginBottom: 16 },
  input: {
    backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: 12, color: colors.text, fontFamily: fonts.body, marginBottom: 10,
  },
});
