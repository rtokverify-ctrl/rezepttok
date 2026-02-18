import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL, THEME_COLOR } from '../constants/Config';

const SetupScreen = ({ userToken, initialDisplayName, onSetupComplete }) => {
    const [setupDisplayName, setSetupDisplayName] = useState(initialDisplayName || '');
    const [setupBio, setSetupBio] = useState('');
    const [setupImageUri, setSetupImageUri] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const pickSetupImage = async () => {
        let r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (!r.canceled) setSetupImageUri(r.assets[0].uri);
    };

    const handleSetupFinish = async () => {
        setIsUploading(true);
        try {
            const p = { display_name: setupDisplayName || "User", bio: setupBio || "" };
            let r;
            if (setupImageUri) {
                r = await FileSystem.uploadAsync(`${BASE_URL}/update-profile`, setupImageUri, { httpMethod: 'POST', uploadType: 1, fieldName: 'file', headers: { 'Authorization': `Bearer ${userToken}` }, parameters: p });
            } else {
                const f = new FormData();
                f.append('display_name', p.display_name);
                f.append('bio', p.bio);
                const raw = await fetch(`${BASE_URL}/update-profile`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` }, body: f });
                r = { status: raw.status };
            }
            if (r.status !== 200) throw new Error("Fehler beim Speichern");
            if (onSetupComplete) onSetupComplete();
        } catch (e) {
            Alert.alert("Fehler", e.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={styles.setupContainer}>
            <Text style={styles.authTitle}>Profil einrichten ✨</Text>
            <Text style={{ color: '#888', textAlign: 'center', marginBottom: 30 }}>Zeig uns, wer du bist!</Text>

            <TouchableOpacity onPress={pickSetupImage} style={{ alignSelf: 'center', marginBottom: 20 }}>
                {setupImageUri ?
                    <Image source={{ uri: setupImageUri }} style={styles.setupAvatar} /> :
                    <View style={styles.setupAvatarPlaceholder}><Ionicons name="camera" size={30} color="#666" /></View>
                }
            </TouchableOpacity>

            <TextInput style={styles.modernInput} value={setupDisplayName} onChangeText={setSetupDisplayName} placeholder="Dein Anzeigename" placeholderTextColor="#666" />
            <TextInput style={styles.modernInput} value={setupBio} onChangeText={setSetupBio} placeholder="Deine Bio (z.B. Ich liebe Pasta!)" placeholderTextColor="#666" />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSetupFinish} disabled={isUploading}>
                {isUploading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Fertigstellen</Text>}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    setupContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', padding: 20 },
    authTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5, textAlign: 'center' },
    setupAvatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: THEME_COLOR },
    setupAvatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    modernInput: { backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white', padding: 15, marginBottom: 15, fontSize: 16 },
    primaryButton: { backgroundColor: THEME_COLOR, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default SetupScreen;
