import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal, ScrollView, TextInput, ActivityIndicator, Alert, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL,  getFullUrl } from '../constants/Config';
import { useGlobal } from '../context/GlobalContext';
import MiniVideo from '../components/MiniVideo';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Skeleton Pulse ──────────────────────────────────────────────────
const SkeletonPulse = ({ style }) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        const anim = Animated.loop(Animated.sequence([
            Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ]));
        anim.start();
        return () => anim.stop();
    }, []);
    return <Animated.View style={[{ backgroundColor: '#222', borderRadius: 8 }, style, { opacity }]} />;
};

const ProfileSkeleton = () => (
    <View style={{ flex: 1, backgroundColor: 'black', paddingTop: 60 }}>
        <View style={{ alignItems: 'center' }}>
            <SkeletonPulse style={{ width: 110, height: 110, borderRadius: 55, marginBottom: 15 }} />
            <SkeletonPulse style={{ width: 120, height: 18, marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', gap: 30, marginBottom: 20 }}>
                <View style={{ alignItems: 'center' }}>
                    <SkeletonPulse style={{ width: 40, height: 20, marginBottom: 6 }} />
                    <SkeletonPulse style={{ width: 50, height: 12 }} />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <SkeletonPulse style={{ width: 40, height: 20, marginBottom: 6 }} />
                    <SkeletonPulse style={{ width: 50, height: 12 }} />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <SkeletonPulse style={{ width: 40, height: 20, marginBottom: 6 }} />
                    <SkeletonPulse style={{ width: 50, height: 12 }} />
                </View>
            </View>
            <SkeletonPulse style={{ width: SCREEN_WIDTH * 0.6, height: 14 }} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 30, borderTopWidth: 1, borderTopColor: '#222' }}>
            {[0,1,2].map(i => <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 15 }}><SkeletonPulse style={{ width: 24, height: 24 }} /></View>)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 1 }}>
            {[0,1,2,3,4,5].map(i => <SkeletonPulse key={i} style={{ width: '33.33%', aspectRatio: 0.7, borderWidth: 1, borderColor: 'black' }} />)}
        </View>
    </View>
);

const ProfileScreen = ({
    userToken,
    myProfileData,
    myVideos,
    likedVideos,
    savedVideos,
    collections,
    collectionVideos,
    loadLikedVideos,
    loadSavedVideosAll,
    fetchCollections,
    loadCollectionVideos,
    activeCollectionId,
    setActiveCollectionId,
    setSelectedRecipe,
    setModalVisible,
    loadMyProfile,
    onLogout
}) => {
    const { themeColor, updateThemeColor } = useGlobal();
    const styles = getStyles(themeColor);

    const router = useRouter();
    const { unreadChatCount } = useGlobal();
    const [profileTab, setProfileTab] = useState('uploads');
    const [savedViewType, setSavedViewType] = useState('all'); // 'all', 'folders', or 'shared'
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [settingsView, setSettingsView] = useState('menu');

    // Settings State
    const [setupDisplayName, setSetupDisplayName] = useState('');
    const [setupBio, setSetupBio] = useState('');
    const [setupImageUri, setSetupImageUri] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const openSettings = () => {
        setSettingsView('menu');
        setSetupDisplayName(myProfileData?.display_name || "");
        setSetupBio(myProfileData?.bio || "");
        setSetupImageUri(myProfileData?.avatar_url ? getFullUrl(myProfileData.avatar_url) : null);
        setSettingsVisible(true);
    };

    const pickSetupImage = async () => {
        let r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (!r.canceled) setSetupImageUri(r.assets[0].uri);
    };

    const handleUpdateProfile = async () => {
        setIsUploading(true);
        try {
            const hasNewImage = setupImageUri && setupImageUri !== (myProfileData?.avatar_url ? getFullUrl(myProfileData.avatar_url) : null);

            if (Platform.OS === 'web') {
                const f = new FormData();
                f.append('display_name', setupDisplayName);
                f.append('bio', setupBio);

                if (hasNewImage) {
                    const response = await fetch(setupImageUri);
                    const blob = await response.blob();
                    f.append('file', blob, 'avatar.jpg');
                }

                const r = await fetch(`${BASE_URL}/update-profile`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${userToken}` },
                    body: f
                });
                if (r.status !== 200) throw new Error("Fehler beim Speichern (Web)");

            } else {
                // Native
                if (hasNewImage) {
                    const r = await FileSystem.uploadAsync(`${BASE_URL}/update-profile`, setupImageUri, {
                        httpMethod: 'POST',
                        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                        fieldName: 'file',
                        headers: { 'Authorization': `Bearer ${userToken}` },
                        parameters: { display_name: setupDisplayName, bio: setupBio }
                    });
                    if (r.status !== 200) throw new Error("Fehler beim Speichern (Native Upload)");
                } else {
                    const f = new FormData();
                    f.append('display_name', setupDisplayName);
                    f.append('bio', setupBio);
                    const r = await fetch(`${BASE_URL}/update-profile`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` }, body: f });
                    if (r.status !== 200) throw new Error("Fehler beim Speichern (Native Text)");
                }
            }

            setSettingsVisible(false);
            setSettingsView('menu');
            loadMyProfile();
            if (Platform.OS === 'web') window.alert("Profil aktualisiert! ✅");
            else Alert.alert("Profil aktualisiert! ✅");

        } catch (e) {
            console.log(e);
            if (Platform.OS === 'web') window.alert("Fehler: " + e.message);
            else Alert.alert("Fehler", e.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleThemeChange = async (color) => {
        updateThemeColor(color);
    };

    const handleDeleteAccount = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Bist du dir GANZ sicher, dass du deinen Account komplett inkl. aller Rezepte löschen möchtest? Dies kann NICHT rückgängig gemacht werden!")) {
                executeAccountDeletion();
            }
        } else {
            Alert.alert(
                "Account endgültig löschen",
                "Möchtest du deinen Account wirklich mit allen Daten löschen? Dies kann nicht rückgängig gemacht werden.",
                [
                    { text: "Abbrechen", style: "cancel" },
                    { text: "Unwiderruflich Löschen", style: "destructive", onPress: () => executeAccountDeletion() }
                ]
            );
        }
    };

    const executeAccountDeletion = async () => {
        try {
            const r = await fetch(`${BASE_URL}/my-profile`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (r.ok) {
                if (Platform.OS === 'web') window.alert("Dein Account wurde mitsamt aller Daten DSGVO-konform gelöscht.");
                else Alert.alert("Erfolg", "Account wurde vollständig gelöscht.");
                setSettingsVisible(false);
                onLogout();
            } else {
                throw new Error("Fehler beim Löschen.");
            }
        } catch (e) {
            console.log(e);
        }
    };

    // --- RENDERERS ---

    const renderSettingsModal = () => (
        <Modal visible={settingsVisible} animationType="slide">
            <View style={styles.container}>
                <View style={styles.settingsHeader}>
                    {settingsView !== 'menu' && (<TouchableOpacity onPress={() => setSettingsView('menu')} style={{ position: 'absolute', left: 20, top: 60, zIndex: 10 }}><Ionicons name="chevron-back" size={30} color="white" /></TouchableOpacity>)}
                    <Text style={styles.modalTitle}>{settingsView === 'menu' ? 'Einstellungen' : 'Profil bearbeiten'}</Text>
                    <TouchableOpacity onPress={() => setSettingsVisible(false)} style={{ position: 'absolute', right: 20, top: 60, zIndex: 10 }}><Ionicons name="close" size={30} color="white" /></TouchableOpacity>
                </View>
                <ScrollView style={{ padding: 20 }}>
                    {settingsView === 'menu' && (<>
                        <Text style={styles.sectionTitle}>Allgemein</Text>
                        <TouchableOpacity onPress={() => setSettingsView('edit')} style={styles.settingsItem}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="person-outline" size={22} color="white" style={{ marginRight: 15 }} /><Text style={styles.settingsItemText}>Profil bearbeiten</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => setSettingsView('theme')} style={styles.settingsItem}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="color-palette-outline" size={22} color="white" style={{ marginRight: 15 }} /><Text style={styles.settingsItemText}>App-Theme wählen</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
                        <TouchableOpacity style={styles.settingsItem}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="notifications-outline" size={22} color="white" style={{ marginRight: 15 }} /><Text style={styles.settingsItemText}>Benachrichtigungen</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>

                        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Rechtliches & Account</Text>
                        <TouchableOpacity style={styles.settingsItem}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="shield-checkmark-outline" size={22} color="white" style={{ marginRight: 15 }} /><Text style={styles.settingsItemText}>Datenschutz</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteAccount} style={[styles.settingsItem, { borderBottomWidth: 0 }]}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="trash-outline" size={22} color="#ff4d4d" style={{ marginRight: 15 }} /><Text style={[styles.settingsItemText, { color: '#ff4d4d' }]}>Account DSGVO-konform löschen</Text></View><Ionicons name="alert-circle-outline" size={20} color="#ff4d4d" /></TouchableOpacity>
                        
                        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 30 }} />
                        <TouchableOpacity onPress={() => { onLogout(); setSettingsVisible(false); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="log-out-outline" size={24} color="#ff4d4d" /><Text style={{ color: '#ff4d4d', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>Abmelden</Text></TouchableOpacity>
                    </>)}
                    
                    {settingsView === 'theme' && (<>
                        <Text style={styles.sectionTitle}>Wähle deine App-Farbe</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 }}>
                            {[
                                { name: 'Violett (Standard)', color: '#660ac2' },
                                { name: 'Neon-Blau', color: '#00C2FF' },
                                { name: 'Smaragd-Grün', color: '#00D68F' },
                                { name: 'Sonnen-Orange', color: '#FF7A00' },
                                { name: 'TikTok-Pink', color: '#fe2c55' }
                            ].map((t) => (
                                <TouchableOpacity 
                                    key={t.color} 
                                    onPress={() => handleThemeChange(t.color)} 
                                    style={{ width: '45%', backgroundColor: '#222', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: themeColor === t.color ? t.color : 'transparent' }}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.color, marginBottom: 10 }} />
                                    <Text style={{ color: 'white', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>{t.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>)}

                    {settingsView === 'edit' && (<>
                        <TouchableOpacity onPress={pickSetupImage} style={{ alignSelf: 'center', marginVertical: 20 }}>{setupImageUri ? <Image source={{ uri: setupImageUri }} style={styles.setupAvatar} /> : <View style={styles.setupAvatarPlaceholder}><Ionicons name="camera" size={30} color="#666" /></View>}<Text style={{ color: themeColor, textAlign: 'center', marginTop: 10 }}>Foto ändern</Text></TouchableOpacity>
                        <Text style={{ color: '#888', marginBottom: 5 }}>Anzeigename</Text><TextInput style={styles.modernInput} value={setupDisplayName} onChangeText={setSetupDisplayName} placeholderTextColor="#666" /><Text style={{ color: '#888', marginBottom: 5 }}>Bio</Text><TextInput style={styles.modernInput} value={setupBio} onChangeText={setSetupBio} placeholderTextColor="#666" /><TouchableOpacity style={styles.primaryButton} onPress={handleUpdateProfile} disabled={isUploading}>{isUploading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Speichern</Text>}</TouchableOpacity>
                    </>)}
                </ScrollView>
            </View>
        </Modal>
    );

    // Wenn wir im "Saved" Tab sind UND ein Ordner aktiv ist, zeigen wir den Inhalt
    if (profileTab === 'saved' && activeCollectionId !== null) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <View style={[styles.profileHeader, { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => setActiveCollectionId(null)}><Ionicons name="arrow-back" size={28} color="white" /></TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 15 }}>Ordner Inhalt</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleShareCollection(activeCollectionId)} style={{ padding: 4 }}>
                        <Ionicons name="share-social-outline" size={24} color={themeColor} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                    data={collectionVideos} numColumns={3}
                    renderItem={({ item }) => <TouchableOpacity onPress={() => { setSelectedRecipe(item); setModalVisible(true); }} style={styles.gridItem}><MiniVideo uri={item.video_url} style={{ width: '100%', height: '100%' }} /></TouchableOpacity>}
                    ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#666' }}>Leer</Text></View>}
                />
                {renderSettingsModal()}
            </View>
        );
    }

    const handleShareCollection = (collectionId) => {
        if (Platform.OS === 'web') {
            const username = window.prompt("Gib den exakten Benutzernamen der Person ein, mit der du diese Sammlung teilen möchtest:");
            if (username) {
                executeShareCollection(collectionId, username);
            }
        } else {
            Alert.prompt(
                "Ordner teilen",
                "Gib den exakten Benutzernamen der Person ein:",
                [
                    { text: "Abbrechen", style: "cancel" },
                    { text: "Teilen", onPress: (username) => executeShareCollection(collectionId, username) }
                ],
                "plain-text"
            );
        }
    };

    const executeShareCollection = async (collectionId, username) => {
        if (!username || !username.trim()) return;
        try {
            const r = await fetch(`${BASE_URL}/collections/${collectionId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify({ shared_with_username: username.trim() })
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.detail || 'Fehler beim Teilen');
            if (Platform.OS === 'web') window.alert('Ordner erfolgreich geteilt!');
            else Alert.alert('Erfolg', 'Ordner erfolgreich geteilt!');
        } catch (e) {
            if (Platform.OS === 'web') window.alert("Fehler: " + e.message);
            else Alert.alert('Fehler', e.message);
        }
    };


    let activeData = [];
    if (profileTab === 'uploads') activeData = myVideos;
    if (profileTab === 'likes') activeData = likedVideos;

    // Show skeleton while profile is loading
    if (!myProfileData) return <ProfileSkeleton />;

    const emptyMessages = {
        uploads: { icon: 'videocam-outline', text: 'Teile dein erstes Rezept!' },
        likes: { icon: 'heart-outline', text: 'Videos die dir gefallen erscheinen hier.' },
        saved: { icon: 'bookmark-outline', text: 'Speichere Rezepte um sie hier zu sehen.' },
    };

    const EmptyGrid = ({ tab }) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

        const msg = emptyMessages[tab] || emptyMessages.uploads;
        return (
            <View style={{ padding: 50, alignItems: 'center' }}>
                <Ionicons name={msg.icon} size={50} color="#333" />
                <Text style={{ color: '#555', fontSize: 15, marginTop: 12, textAlign: 'center' }}>{msg.text}</Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <LinearGradient
                colors={['rgba(102, 10, 194, 0.4)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)']}
                locations={[0, 0.6, 1]}
                style={styles.profileHeader}
            >
                {/* HEADER BUTTONS */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', paddingRight: 20 }}>
                    <TouchableOpacity onPress={() => router.push('/chat')} style={{ marginRight: 20, position: 'relative' }}>
                        <Ionicons name="chatbubble-ellipses-outline" size={25} color="white" />
                        {unreadChatCount > 0 && (
                            <View style={{ position: 'absolute', top: -5, right: -8, backgroundColor: '#ff3b30', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{unreadChatCount > 99 ? '99+' : unreadChatCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginRight: 20 }}>
                        <Ionicons name="share-social-outline" size={26} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openSettings}>
                        <Ionicons name="menu-outline" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center', marginTop: -10 }}>
                    <View style={{ marginBottom: 15, padding: 4, borderRadius: 65, backgroundColor: 'rgba(102, 10, 194, 0.2)' }}>
                        {myProfileData?.avatar_url ?
                            <Image source={{ uri: getFullUrl(myProfileData.avatar_url) }} style={styles.profileAvatar} /> :
                            <View style={styles.profileAvatarPlaceholder}><Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>{(myProfileData?.display_name || "U").charAt(0)}</Text></View>
                        }
                    </View>

                    <Text style={styles.profileName}>@{myProfileData?.display_name?.replace(/\s/g, '') || 'user'}</Text>
                    <Text style={styles.profileBio}>{myProfileData?.bio || "Keine Bio vorhanden"}</Text>

                    <View style={styles.profileStatsRow}>
                        <View style={styles.profileStatCard}>
                            <Text style={styles.profileStatNumber}>{myProfileData?.followers_count || 0}</Text>
                            <Text style={styles.profileStatLabel}>Follower</Text>
                        </View>
                        <View style={styles.profileStatCard}>
                            <Text style={styles.profileStatNumber}>{myProfileData?.following_count || 0}</Text>
                            <Text style={styles.profileStatLabel}>Folge ich</Text>
                        </View>
                        <View style={styles.profileStatCard}>
                            <Text style={styles.profileStatNumber}>{myVideos.length}</Text>
                            <Text style={styles.profileStatLabel}>Videos</Text>
                        </View>
                    </View>

                </View>
            </LinearGradient>
            <View style={styles.tabContainer}>
                <TouchableOpacity onPress={() => setProfileTab('uploads')} style={[styles.tabItem, profileTab === 'uploads' && styles.activeTab]}><Ionicons name="grid-outline" size={24} color={profileTab === 'uploads' ? 'white' : '#666'} /></TouchableOpacity>
                <TouchableOpacity onPress={() => { setProfileTab('likes'); loadLikedVideos(); }} style={[styles.tabItem, profileTab === 'likes' && styles.activeTab]}><Ionicons name="heart-outline" size={24} color={profileTab === 'likes' ? 'white' : '#666'} /></TouchableOpacity>
                <TouchableOpacity onPress={() => { setProfileTab('saved'); setSavedViewType('all'); loadSavedVideosAll(); }} style={[styles.tabItem, profileTab === 'saved' && styles.activeTab]}><Ionicons name="bookmark-outline" size={24} color={profileTab === 'saved' ? 'white' : '#666'} /></TouchableOpacity>
            </View>

            {profileTab === 'saved' ? (
                <>
                    {/* SUB-TAB SWITCH FÜR SAVED */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}>
                        <TouchableOpacity onPress={() => { setSavedViewType('all'); loadSavedVideosAll(); }} style={{ paddingHorizontal: 15, paddingVertical: 5, backgroundColor: savedViewType === 'all' ? '#333' : 'transparent', borderRadius: 15 }}>
                            <Text style={{ color: savedViewType === 'all' ? 'white' : '#888', fontWeight: 'bold' }}>Alle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSavedViewType('folders'); fetchCollections(); }} style={{ paddingHorizontal: 15, paddingVertical: 5, backgroundColor: savedViewType === 'folders' ? '#333' : 'transparent', borderRadius: 15, marginLeft: 10 }}>
                            <Text style={{ color: savedViewType === 'folders' ? 'white' : '#888', fontWeight: 'bold' }}>Ordner</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSavedViewType('shared'); fetchCollections(); }} style={{ paddingHorizontal: 15, paddingVertical: 5, backgroundColor: savedViewType === 'shared' ? '#333' : 'transparent', borderRadius: 15, marginLeft: 10 }}>
                            <Text style={{ color: savedViewType === 'shared' ? 'white' : '#888', fontWeight: 'bold' }}>Geteilt</Text>
                        </TouchableOpacity>
                    </View>

                    {savedViewType === 'all' ? (
                        <FlatList
                            key={'saved-all'}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            data={savedVideos} numColumns={3}
                            renderItem={({ item }) => <TouchableOpacity onPress={() => { setSelectedRecipe(item); setModalVisible(true); }} style={styles.gridItem}><MiniVideo uri={item.video_url} style={{ width: '100%', height: '100%' }} /></TouchableOpacity>}
                            ListEmptyComponent={<EmptyGrid tab="saved" />}
                        />
                    ) : savedViewType === 'folders' ? (
                        <FlatList
                            key={'saved-folders'}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            data={collections || []}
                            numColumns={2}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => loadCollectionVideos(item.id)} style={styles.collectionItem}>
                                    <View style={{ position: 'absolute', top: 10, right: 10 }}>
                                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleShareCollection(item.id); }}>
                                            <Ionicons name="share-social-outline" size={20} color="rgba(255,255,255,0.7)" />
                                        </TouchableOpacity>
                                    </View>
                                    <Ionicons name="folder" size={50} color={themeColor} />
                                    <Text style={{ color: 'white', marginTop: 5, fontWeight: 'bold' }}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#666' }}>Keine Ordner.</Text></View>}
                        />
                    ) : (
                        <FlatList
                            key={'saved-shared'}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            data={sharedCollections || []}
                            numColumns={2}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => loadCollectionVideos(item.id)} style={styles.collectionItem}>
                                    <Ionicons name="folder-open" size={50} color="#00C2FF" />
                                    <Text style={{ color: 'white', marginTop: 5, fontWeight: 'bold', textAlign: 'center' }}>{item.name}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>von {item.owner_name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#666' }}>Nichts geteilt.</Text></View>}
                        />
                    )}
                </>
            ) : (
                <FlatList
                    key={'videos-grid-' + profileTab}
                    keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                    data={activeData} numColumns={3}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => { setSelectedRecipe(item); setModalVisible(true); }} style={styles.gridItem}>
                            <MiniVideo uri={item.video_url} style={{ width: '100%', height: '100%' }} />
                            <View style={{ position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="play-outline" size={14} color="white" />
                                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textShadowColor: 'black', textShadowRadius: 4 }}>{item.views || item.likes || 0}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<EmptyGrid tab={profileTab} />}
                />
            )}

            {renderSettingsModal()}
        </View>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    profileHeader: { width: '100%', paddingVertical: 20, paddingTop: 50 },
    profileAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: themeColor },
    profileAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: themeColor, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
    profileName: { color: 'white', fontSize: 22, fontWeight: '800', marginTop: 10, letterSpacing: 0.5 },
    profileBio: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20, marginTop: 8 },
    
    profileStatsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 24, marginBottom: 10, paddingHorizontal: 20 },
    profileStatCard: { flex: 1, backgroundColor: 'rgba(102, 10, 194, 0.1)', borderWidth: 1, borderColor: 'rgba(102, 10, 194, 0.2)', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
    profileStatNumber: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    profileStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
    
    editProfileBtn: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 140 },
    editProfileText: { color: 'white', fontWeight: '600', fontSize: 15 },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 15 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: themeColor },
    gridItem: { width: '33.33%', aspectRatio: 9/16, borderWidth: 1, borderColor: 'black', position: 'relative' },
    collectionItem: { width: '45%', aspectRatio: 1, margin: '2.5%', backgroundColor: '#222', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    // Settings Modal Styles
    settingsHeader: { padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' },
    modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    sectionTitle: { color: '#888', fontSize: 14, textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
    settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
    settingsItemText: { color: 'white', fontSize: 16 },
    setupAvatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: themeColor },
    setupAvatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    modernInput: { backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white', padding: 15, marginBottom: 15, fontSize: 16 },
    primaryButton: { backgroundColor: themeColor, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default ProfileScreen;
