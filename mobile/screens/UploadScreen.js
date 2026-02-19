import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL, THEME_COLOR } from '../constants/Config';
import MiniVideo from '../components/MiniVideo';

// Conditional imports: different compression for each platform
let NativeVideoCompressor;
let compressVideoWeb;
if (Platform.OS === 'web') {
    compressVideoWeb = require('../utils/compressVideoWeb').compressVideoWeb;
} else {
    NativeVideoCompressor = require('react-native-compressor').Video;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// In-page toast message component (no browser popups!)
const InPageMessage = ({ message, type, onDismiss }) => {
    if (!message) return null;
    const bgColor = type === 'error' ? '#ff4444' : type === 'success' ? '#22c55e' : '#FFB800';
    return (
        <TouchableOpacity onPress={onDismiss} style={{ backgroundColor: bgColor, padding: 14, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={type === 'error' ? 'alert-circle' : type === 'success' ? 'checkmark-circle' : 'information-circle'} size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', flex: 1, fontSize: 14, fontWeight: '500' }}>{message}</Text>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
    );
};

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
    const [toastMessage, setToastMessage] = useState(null); // { text, type }

    // Auto-dismiss success toasts after 4s
    useEffect(() => {
        if (toastMessage?.type === 'success') {
            const t = setTimeout(() => setToastMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toastMessage]);

    const showMessage = (text, type = 'error') => {
        if (Platform.OS === 'web') {
            setToastMessage({ text, type });
        } else {
            Alert.alert(
                type === 'error' ? 'Fehler' : type === 'success' ? 'Erfolg' : 'Info',
                text
            );
        }
    };

    const pickVideo = async () => {
        let r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 1,
        });
        if (!r.canceled) setUploadVideoUri(r.assets[0].uri);
    };

    const getFileSize = async (uri) => {
        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            return blob.size;
        } else {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            return fileInfo.size;
        }
    };

    const compressVideo = async (uri) => {
        if (Platform.OS === 'web') {
            try {
                setCompressionStatus('Video wird komprimiert...');
                const compressedBlobUrl = await compressVideoWeb(uri, (progress) => {
                    setCompressionStatus(`Komprimiere: ${Math.round(progress * 100)}%`);
                });
                setCompressionStatus('');
                return compressedBlobUrl;
            } catch (e) {
                console.log('Web compression failed, using original:', e);
                setCompressionStatus('');
                return uri;
            }
        } else {
            if (!NativeVideoCompressor) return uri;
            try {
                setCompressionStatus('Komprimiere Video...');
                const compressedUri = await NativeVideoCompressor.compress(uri, {
                    compressionMethod: 'auto',
                    maxSize: 720,
                    bitrate: 2000000,
                }, (progress) => {
                    setCompressionStatus(`Komprimiere: ${Math.round(progress * 100)}%`);
                });

                try {
                    const originalInfo = await FileSystem.getInfoAsync(uri);
                    const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
                    const savedPercent = Math.round((1 - compressedInfo.size / originalInfo.size) * 100);
                    console.log(`Native Compression: ${(originalInfo.size / 1024 / 1024).toFixed(1)}MB → ${(compressedInfo.size / 1024 / 1024).toFixed(1)}MB (${savedPercent}% saved)`);
                } catch (e) { /* ignore logging errors */ }

                setCompressionStatus('');
                return compressedUri;
            } catch (e) {
                console.log('Native compression failed, using original:', e);
                setCompressionStatus('');
                return uri;
            }
        }
    };

    const handleUpload = async () => {
        if (!uploadVideoUri) return;
        setToastMessage(null);

        setIsUploading(true);
        setUploadProgress(0);
        setIsProcessing(false);

        try {
            // Step 1: Compress video (platform-specific)
            const videoToUpload = await compressVideo(uploadVideoUri);

            // Step 2: Check file size AFTER compression
            try {
                const fileSize = await getFileSize(videoToUpload);
                const sizeMB = (fileSize / 1024 / 1024).toFixed(1);
                console.log(`Compressed file size: ${sizeMB}MB`);

                if (fileSize > MAX_FILE_SIZE) {
                    showMessage(`Das Video ist nach der Komprimierung immer noch zu groß (${sizeMB}MB). Bitte kürze es oder wähle ein kleineres Video. Limit: 50MB.`);
                    setIsUploading(false);
                    return;
                }
            } catch (e) {
                console.log("Size check failed", e);
                showMessage("Dateigröße konnte nicht geprüft werden.");
                setIsUploading(false);
                return;
            }

            // Step 3: Upload
            let vUrl;

            if (Platform.OS === 'web') {
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
                            reject(new Error("Upload fehlgeschlagen"));
                        }
                    };

                    xhr.onerror = () => reject(new Error("Netzwerkfehler"));
                    xhr.send(formData);
                });
            } else {
                const task = FileSystem.createUploadTask(`${BASE_URL}/upload-video`, videoToUpload, { httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.MULTIPART, fieldName: 'file', headers: { 'Authorization': `Bearer ${userToken}` } }, (data) => { const percent = data.totalBytesSent / data.totalBytesExpectedToSend; setUploadProgress(Math.floor(percent * 100)); });
                const result = await task.uploadAsync();
                vUrl = JSON.parse(result.body).url;
            }

            // Step 4: Create recipe entry
            setIsProcessing(true);
            const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
            const rData = { title: uploadTitle, video_url: vUrl, ingredients: ingredientsText.split('\n').map(l => ({ name: l, amount: "1", unit: "x" })), steps: stepsText.split('\n').map((l, i) => ({ order: i + 1, instruction: l })), tags: tagsArray, tips: uploadTips || null };
            await fetch(`${BASE_URL}/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'bypass-tunnel-reminder': 'true' }, body: JSON.stringify(rData) });

            showMessage("Dein Rezept ist online! 🎉", "success");
            setUploadTitle(''); setUploadVideoUri(null); setUploadTags(''); setUploadTips(''); setIngredientsText(''); setStepsText(''); setUploadProgress(0); setIsProcessing(false);
            if (onUploadComplete) onUploadComplete();
        } catch (e) {
            showMessage(e.message);
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

                {/* In-page toast (web only, replaces browser alerts) */}
                <InPageMessage
                    message={toastMessage?.text}
                    type={toastMessage?.type}
                    onDismiss={() => setToastMessage(null)}
                />

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
