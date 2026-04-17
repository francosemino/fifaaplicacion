import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { ScreenHeader, Btn } from '../../src/ui';
import Avatar from '../../src/Avatar';

export default function NewPlayer() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Necesitamos permiso de galería');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets && res.assets[0]?.base64) {
      setAvatar(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('El nombre es obligatorio');
      return;
    }
    await api.createPlayer({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      favorite_team: favoriteTeam.trim() || undefined,
      avatar_base64: avatar || undefined,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Nuevo jugador" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40, gap: 14 }}>
        <TouchableOpacity style={styles.avatarWrap} onPress={pick} testID="avatar-pick">
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} />
          ) : (
            <Avatar name={name || '?'} size={120} />
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#0A0B0E" />
          </View>
        </TouchableOpacity>

        <Label text="Nombre" />
        <TextInput
          style={styles.input}
          placeholder="Ej: Franco"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          testID="player-name-input"
        />
        <Label text="Apodo (opcional)" />
        <TextInput
          style={styles.input}
          placeholder="Ej: Fran"
          placeholderTextColor={colors.textMuted}
          value={nickname}
          onChangeText={setNickname}
          testID="player-nickname-input"
        />
        <Label text="Equipo favorito (opcional)" />
        <TextInput
          style={styles.input}
          placeholder="Ej: Real Madrid"
          placeholderTextColor={colors.textMuted}
          value={favoriteTeam}
          onChangeText={setFavoriteTeam}
          testID="player-team-input"
        />
        <Btn label="Crear jugador" icon="checkmark" onPress={submit} testID="player-create-submit" style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  avatarWrap: {
    alignSelf: 'center', marginTop: 10, marginBottom: 10, position: 'relative',
  },
  avatarImg: { width: 120, height: 120, borderRadius: radius.xl },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  label: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5 },
  input: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: 14, color: colors.text, fontFamily: fonts.body, fontSize: 15,
  },
});
