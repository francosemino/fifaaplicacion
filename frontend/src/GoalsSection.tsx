import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { api } from './api';
import { colors, fonts, radius, spacing } from './theme';
import Avatar from './Avatar';
import { Btn } from './ui';

const MAX_VIDEO_BYTES = 8 * 1024 * 1024;

type Props = {
  editionId: string;
  competitionId: string;
  competitionType: 'championship' | 'cup';
  participants: { id: string; name: string; avatar_base64?: string | null }[];
  allowMarkBest?: boolean;
};

export default function GoalsSection({
  editionId,
  competitionId,
  competitionType,
  participants,
  allowMarkBest = true,
}: Props) {
  const [goals, setGoals] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [playGoal, setPlayGoal] = useState<any | null>(null);

  const load = useCallback(async () => {
    const list = await api.listGoals({
        competition_id: competitionId,
        competition_type: competitionType,
        include_video: false,
    });

    setGoals(list);
  }, [competitionId, competitionType]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onCreated = () => { setModalOpen(false); load(); };

  const pBy = (pid: string) => participants.find((p) => p.id === pid);

  const toggleBest = async (gid: string) => {
    await api.markTournamentBest(gid);
    load();
  };

  const togglePuskas = async (gid: string) => {
    await api.markPuskas(gid);
    load();
  };

  const deleteGoal = (gid: string) => {
    Alert.alert('Eliminar gol', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await api.deleteGoal(gid); load(); } },
    ]);
  };

  const deleteVideo = async (gid: string) => {
    const ok = window.confirm('¿Seguro que querés eliminar el video de este gol? El gol va a seguir existiendo.');

    if (!ok) return;

    await api.deleteGoalVideo(gid);
    await load();
  };

  const openPlayer = async (g: any) => {
    // Fetch full goal with video
    const full = await api.getGoal(g.id);
    setPlayGoal(full);
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🎬 Mejor gol del torneo</Text>
          <Text style={styles.sub}>Subí videos de los mejores goles</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          style={styles.addBtn}
          testID="add-goal-button"
        >
          <Ionicons name="add" size={18} color="#0A0B0E" />
          <Text style={styles.addBtnText}>Gol</Text>
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="football-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aún no hay goles cargados</Text>
        </View>
      ) : (
        goals.map((g) => {
          const p = pBy(g.player_id);
          return (
            <View
              key={g.id}
              style={[styles.goalCard, g.is_tournament_best && { borderColor: colors.gold, borderWidth: 1.5 }]}
              testID={`goal-card-${g.id}`}
            >
              <TouchableOpacity style={styles.thumb} onPress={() => openPlayer(g)} testID={`play-goal-${g.id}`}>
                <Ionicons name="play-circle" size={36} color={colors.gold} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.goalTitle} numberOfLines={1}>{g.title}</Text>
                  {g.is_tournament_best ? (
                    <Ionicons name="trophy" size={16} color={colors.gold} />
                  ) : null}
                  {g.is_puskas ? (
                    <Text style={styles.puskasTag}>PUSKAS</Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {p ? <Avatar name={p.name} avatar={p.avatar_base64} size={20} /> : null}
                  <Text style={styles.goalAuthor}>{p?.name || 'Sin jugador'}</Text>
                </View>
                {g.description ? (
                  <Text style={styles.goalDesc} numberOfLines={2}>{g.description}</Text>
                ) : null}
              </View>
              <View style={{ gap: 6 }}>
                {allowMarkBest ? (
                    <TouchableOpacity
                    onPress={() => toggleBest(g.id)}
                    style={[
                        styles.iconBtn,
                        g.is_tournament_best && {
                        backgroundColor: colors.gold,
                        borderColor: colors.gold,
                        },
                    ]}
                    testID={`mark-best-${g.id}`}
                    >
                    <Ionicons
                        name="trophy"
                        size={14}
                        color={g.is_tournament_best ? '#0A0B0E' : colors.gold}
                    />
                    </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                    onPress={() => togglePuskas(g.id)}
                    style={[
                    styles.iconBtn,
                    g.is_puskas && {
                        backgroundColor: colors.gold,
                        borderColor: colors.gold,
                    },
                    ]}
                    testID={`mark-puskas-${g.id}`}
                >
                    <Ionicons
                    name="star"
                    size={14}
                    color={g.is_puskas ? '#0A0B0E' : colors.gold}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                onPress={() => deleteVideo(g.id)}
                style={styles.iconBtn}
                testID={`delete-goal-video-${g.id}`}
                >
                <Ionicons name="videocam-off-outline" size={14} color={colors.danger} />
                </TouchableOpacity>

                <TouchableOpacity
                onPress={() => deleteGoal(g.id)}
                style={styles.iconBtn}
                testID={`delete-goal-${g.id}`}
                >
                <Ionicons name="trash-outline" size={14} color={colors.danger} />
                </TouchableOpacity>
                </View>
            </View>
          );
        })
      )}

      <AddGoalModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onDone={onCreated}
        editionId={editionId}
        competitionId={competitionId}
        competitionType={competitionType}
        participants={participants}
      />

      <VideoPlayerModal visible={!!playGoal} onClose={() => setPlayGoal(null)} goal={playGoal} />
    </View>
  );
}

function AddGoalModal({
  visible, onClose, onDone, editionId, competitionId, competitionType, participants,
}: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [video, setVideo] = useState<{ base64: string; mime: string } | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setTitle(''); setDescription(''); setPlayerId(null); setOpponentId(null); setVideo(null); setSaving(false);
    }
  }, [visible]);

  const pickVideo = async () => {
    const doc = (globalThis as any).document;
    const FileReaderCtor = (globalThis as any).FileReader;

    if (!doc || !FileReaderCtor) {
        Alert.alert('No disponible', 'La carga de video está disponible solo en web.');
        return;
    }

    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';

    input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;

        if (file.size > MAX_VIDEO_BYTES) {
        Alert.alert(
            'Video muy grande',
            `El video pesa ~${Math.round(file.size / 1024 / 1024)} MB. El máximo es 8 MB. Probá con un clip más corto.`
        );
        return;
        }

        const reader = new FileReaderCtor();

        reader.onload = () => {
        const result = String(reader.result || '');
        const commaIndex = result.indexOf(',');
        const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;

        setVideo({
            base64,
            mime: file.type || 'video/mp4',
        });
        };

        reader.onerror = () => {
        Alert.alert('Error', 'No pudimos leer el video');
        };

        reader.readAsDataURL(file);
    };

    input.click();
  };

  const submit = async () => {
    if (!title.trim()) return Alert.alert('Ponele un título al gol');
    if (!playerId) return Alert.alert('Elegí quién hizo el gol');
    setSaving(true);
    try {
        await api.createGoal({
        edition_id: editionId,
        competition_id: competitionId,
        competition_type: competitionType,
        player_id: playerId,
        opponent_id: opponentId,
        title: title.trim(),
        description: description.trim(),
        video_base64: video ? `data:${video.mime};base64,${video.base64}` : null,
        video_mime: video?.mime || null,
    });
      onDone();
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.bg}>
        <View style={modalStyles.card}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={modalStyles.title}>Nuevo gol</Text>

            <Text style={modalStyles.label}>TÍTULO</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Ej: Chilena desde 30 mts"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              testID="goal-title-input"
            />

            <Text style={modalStyles.label}>JUGADOR QUE LO HIZO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {participants.map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPlayerId(p.id)}
                  style={[modalStyles.chip, playerId === p.id && modalStyles.chipActive]}
                  testID={`goal-player-${p.name}`}
                >
                  <Avatar name={p.name} avatar={p.avatar_base64} size={22} />
                  <Text style={[modalStyles.chipText, playerId === p.id && { color: '#0A0B0E' }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={modalStyles.label}>RIVAL (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {participants.filter((p: any) => p.id !== playerId).map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setOpponentId(opponentId === p.id ? null : p.id)}
                  style={[modalStyles.chip, opponentId === p.id && modalStyles.chipActive]}
                  testID={`goal-opponent-${p.name}`}
                >
                  <Avatar name={p.name} avatar={p.avatar_base64} size={22} />
                  <Text style={[modalStyles.chipText, opponentId === p.id && { color: '#0A0B0E' }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={modalStyles.label}>DESCRIPCIÓN (opcional)</Text>
            <TextInput
              style={[modalStyles.input, { height: 70 }]}
              placeholder="Cómo fue la jugada..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              testID="goal-desc-input"
            />

            <Text style={modalStyles.label}>VIDEO (opcional, máx. 30s)</Text>
            <TouchableOpacity
              style={[modalStyles.videoBtn, video && { borderColor: colors.gold }]}
              onPress={pickVideo}
              testID="pick-video-button"
            >
              <Ionicons name={video ? 'checkmark-circle' : 'videocam'} size={24} color={video ? colors.gold : colors.textSecondary} />
              <Text style={modalStyles.videoBtnText}>
                {video ? 'Video listo (tocá para cambiar)' : 'Subir video desde galería'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Btn label="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
              <Btn
                label={saving ? 'Guardando...' : 'Guardar gol'}
                onPress={submit}
                disabled={saving}
                style={{ flex: 1 }}
                testID="goal-save-submit"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function VideoPlayerModal({ visible, onClose, goal }: any) {
  if (!visible || !goal) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={playerStyles.bg}>
        <TouchableOpacity onPress={onClose} style={playerStyles.closeBtn} testID="video-close">
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={playerStyles.content}>
          <Text style={playerStyles.title}>{goal.title}</Text>

          {goal.description ? (
            <Text style={playerStyles.desc}>{goal.description}</Text>
          ) : null}

          {goal.video_base64 ? (
            React.createElement('video' as any, {
              src: goal.video_base64,
              controls: true,
              autoPlay: true,
              style: {
                width: '100%',
                maxHeight: 480,
                borderRadius: 16,
                backgroundColor: '#000',
              },
            })
          ) : (
            <View style={playerStyles.noVideo}>
              <Ionicons name="film-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.body, marginTop: 8 }}>
                Este gol no tiene video
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 16 },
  sub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill,
  },
  addBtnText: { color: '#0A0B0E', fontFamily: fonts.bodyBold, fontSize: 13 },
  empty: { alignItems: 'center', padding: 18, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: 6 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 },
  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md,
  },
  thumb: {
    width: 56, height: 56, backgroundColor: '#000', borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  goalTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14, flex: 1 },
  goalAuthor: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  goalDesc: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, marginTop: 4 },
  puskasTag: {
    color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.5,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.gold,
  },
  iconBtn: {
    width: 32, height: 32, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
  },
});

const modalStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  title: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 22, marginBottom: 8 },
  label: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: 12, color: colors.text, fontFamily: fonts.body, fontSize: 14,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 12 },
  videoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated, borderStyle: 'dashed',
  },
  videoBtnText: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
});

const playerStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  content: { width: '100%', maxWidth: 600, gap: 12 },
  title: { color: colors.text, fontFamily: fonts.headingBlack, fontSize: 22, textAlign: 'center' },
  desc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  video: { width: '100%', height: 320, backgroundColor: '#000', borderRadius: 16 },
  noVideo: { padding: 40, alignItems: 'center' },
});
