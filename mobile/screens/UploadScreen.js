import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL, THEME_COLOR } from '../constants/Config';
import MiniVideo from '../components/MiniVideo';

// Conditional import: react-native-compressor only works on native (not web)
let Video;
if (Platform.OS !== 'web') {
    Video = require('react-native-compressor').Video;
}

const UploadScreen = ({ userToken, onUploadComplete }) => {
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadVideoUri, setUploadVideoUri] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [ingredientsText, setIngredientsText] = useState('');
    const [stepsText, setStepsText] = useState('');
    const [uploadTags, setUploadTags] = useState('');
    const [uploadTips, setUploadTips] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [compressionStatus, setCompressionStatus] = useState('');

    const pickVideo = async () => {
        let r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 1, // Pick at full quality — we compress ourselves
        });
        if (!r.canceled) setUploadVideoUri(r.assets[0].uri);
    };

    const compressVideo = async (uri) => {
        // Web: no native compression available, return as-is
        if (Platform.OS === 'web' || !Video) {
            return uri;
        }

        try {
            setCompressionStatus('Komprimiere Video...');
            const compressedUri = await Video.compress(uri, {
                compressionMethod: 'auto',
                maxSize: 720,          // Max 720p (height for portrait, width for landscape)
                bitrate: 2000000,      // 2 Mbps — good quality for mobile viewing
            }, (progress) => {
                setCompressionStatus(`Komprimiere: ${Math.round(progress * 100)}%`);
            });

            // Log size reduction
            if (FileSystem) {
                try {
                    const originalInfo = await FileSystem.getInfoAsync(uri);
                    const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
                    const savedMB = ((originalInfo.size - compressedInfo.size) / (1024 * 1024)).toFixed(1);
                    const savedPercent = Math.round((1 - compressedInfo.size / originalInfo.size) * 100);
                    console.log(`Compression: ${(originalInfo.size / 1024 / 1024).toFixed(1)}MB → ${(compressedInfo.size / 1024 / 1024).toFixed(1)}MB (${savedPercent}% saved, ${savedMB}MB weniger)`);
                } catch (e) {
                    console.log('Could not get file sizes for logging');
                }
            }

            setCompressionStatus('');
            return compressedUri;
        } catch (e) {
            console.log('Compression failed, using original:', e);
            setCompressionStatus('');
            return uri; // Fallback to original if compression fails
        }
    };

    const handleUpload = async () => {
        if (!uploadVideoUri) return;

        // Check file size before compression (50MB limit on original)
        try {
            let fileSize = 0;
            if (Platform.OS === 'web') {
                const response = await fetch(uploadVideoUri);
                const blob = await response.blob();
                fileSize = blob.size;
            } else {
                const fileInfo = await FileSystem.getInfoAsync(uploadVideoUri);
                fileSize = fileInfo.size;
            }

            console.log("Original file size:", fileSize);

            if (fileSize > 50 * 1024 * 1024) {
                if (Platform.OS === 'web') {
                    window.alert("Datei zu groß! Das Video ist größer als 50MB.");
                } else {
                    Alert.alert("Datei zu groß", "Das Video ist größer als 50MB. Bitte kürze es oder wähle ein kleineres Video.");
                }
                return;
            }
        } catch (e) {
            console.log("Size check failed", e);
            Alert.alert("Fehler", "Dateigröße konnte nicht geprüft werden.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setIsProcessing(false);

        try {
            // Step 1: Compress video (native only)
            const videoToUpload = await compressVideo(uploadVideoUri);

            // Step 2: Upload
            let vUrl;

            if (Platform.OS === 'web') {
                // Web Upload via XMLHttpRequest for Progress
                const videoBlob = await (await fetch(videoToUpload)).blob();
                const formData = new FormData();
                formData.append('file', videoBlob, 'video.mp4');

                vUrl = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `${BASE_URL}/upload-video`);
                    xhr.setRequestHeader('Authorization', `Bearer ${userToken}`);

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            setUploadProgress(Math.round((event.loaded / event.total) * 100));
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                resolve(response.url);
                            } catch (e) {
                                reject(new Error("Invalid JSON response"));
                            }
                        } else {
                            reject(new Error("Upload failed"));
                        }
                    };

                    xhr.onerror = () => reject(new Error("Network Error"));
                    xhr.send(formData);
                });
            } else {
                // Mobile Upload via FileSystem
                const task = FileSystem.createUploadTask(`${BASE_URL}/upload-video`, videoToUpload, { httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.MULTIPART, fieldName: 'file', headers: { 'Authorization': `Bearer ${userToken}` } }, (data) => { const percent = data.totalBytesSent / data.totalBytesExpectedToSend; setUploadProgress(Math.floor(percent * 100)); });
                const result = await task.uploadAsync();
                vUrl = JSON.parse(result.body).url;
            }

            // Step 3: Create recipe entry
            setIsProcessing(true);
            const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
            const rData = { title: uploadTitle, video_url: vUrl, ingredients: ingredientsText.split('\n').map(l => ({ name: l, amount: "1", unit: "x" })), steps: stepsText.split('\n').map((l, i) => ({ order: i + 1, instruction: l })), tags: tagsArray, tips: uploadTips || null };
            await fetch(`${BASE_URL}/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'bypass-tunnel-reminder': 'true' }, body: JSON.stringify(rData) });
            Alert.alert("Erfolg", "Dein Rezept ist online!");
            // Reset form
            setUploadTitle(''); setUploadVideoUri(null); setUploadTags(''); setUploadTips(''); setIngredientsText(''); setStepsText(''); setUploadProgress(0); setIsProcessing(false);
            if (onUploadComplete) onUploadComplete();
        } catch (e) {
            Alert.alert("Fehler", e.message);
        } finally {
            setIsUploading(false);
            setIsProcessing(false);
            setCompressionStatus('');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'black', paddingTop: 40 }}>
            <ScrollView style={styles.uploadContainer}>
                <Text style={styles.headerTitle}>Neues Rezept teilen</Text>
                <TouchableOpacity onPress={pickVideo} style={styles.uploadPreview}>
                    {uploadVideoUri ? <MiniVideo uri={uploadVideoUri} style={{ width: '100%', height: '100%' }} /> : <Ionicons name="cloud-upload" size={40} color="#666" />}
                </TouchableOpacity>
                {(isUploading || compressionStatus) && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: 'white', marginBottom: 5, textAlign: 'center' }}>
                            {compressionStatus || (isProcessing ? "Verarbeite Rezept..." : `Lade hoch: ${uploadProgress}%`)}
                        </Text>
                        <View style={{ height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: compressionStatus ? '100%' : `${uploadProgress}%`, backgroundColor: compressionStatus ? '#FFB800' : THEME_COLOR }} />
                        </View>
                    </View>
                )}
                <TextInput style={styles.modernInput} value={uploadTitle} onChangeText={setUploadTitle} placeholder="Titel des Gerichts" placeholderTextColor="#666" />
                <TextInput style={styles.modernInput} value={uploadTags} onChangeText={setUploadTags} placeholder="Tags (z.B. Vegan, Schnell)" placeholderTextColor="#666" />
                <TextInput style={[styles.modernInput, { height: 60 }]} multiline value={ingredientsText} onChangeText={setIngredientsText} placeholder="Zutaten (Liste)" placeholderTextColor="#666" />
                <TextInput style={[styles.modernInput, { height: 60 }]} multiline value={stepsText} onChangeText={setStepsText} placeholder="Zubereitungsschritte" placeholderTextColor="#666" />
                <TextInput style={styles.modernInput} value={uploadTips} onChangeText={setUploadTips} placeholder="Dein Geheimtipp (Optional)" placeholderTextColor="#666" />
                <TouchableOpacity style={[styles.primaryButton, { marginBottom: 50, opacity: isUploading ? 0.5 : 1 }]} onPress={handleUpload} disabled={isUploading}>
                    <Text style={styles.primaryButtonText}>Veröffentlichen</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    uploadContainer: { padding: 20 },
    uploadPreview: { width: '100%', height: 200, backgroundColor: '#1a1a1a', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
    modernInput: { backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white', padding: 15, marginBottom: 15, fontSize: 16 },
    primaryButton: { backgroundColor: THEME_COLOR, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default UploadScreen;
