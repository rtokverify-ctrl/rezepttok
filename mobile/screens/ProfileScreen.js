import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR } from '../constants/Config';
import MiniVideo from '../components/MiniVideo';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

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
    const [profileTab, setProfileTab] = useState('uploads');
    const [savedViewType, setSavedViewType] = useState('all'); // 'all' or 'folders'
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
        setSetupImageUri(myProfileData?.avatar_url ? `${BASE_URL}${myProfileData.avatar_url}` : null);
        setSettingsVisible(true);
    };

    const pickSetupImage = async () => {
        let r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (!r.canceled) setSetupImageUri(r.assets[0].uri);
    };

    const handleUpdateProfile = async () => {
        setIsUploading(true);
        try {
            const p = { display_name: setupDisplayName, bio: setupBio };
            let r;
            if (setupImageUri && setupImageUri !== (myProfileData?.avatar_url ? `${BASE_URL}${myProfileData.avatar_url}` : null)) {
                r = await FileSystem.uploadAsync(`${BASE_URL}/update-profile`, setupImageUri, { httpMethod: 'POST', uploadType: 1, fieldName: 'file', headers: { 'Authorization': `Bearer ${userToken}` }, parameters: p });
            } else {
                const f = new FormData();
                f.append('display_name', p.display_name);
                f.append('bio', p.bio);
                const raw = await fetch(`${BASE_URL}/update-profile`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` }, body: f });
                r = { status: raw.status };
            }
            if (r.status !== 200) throw new Error("Fehler");
            setSettingsVisible(false);
            setSettingsView('menu');
            loadMyProfile();
            Alert.alert("Profil aktualisiert! ✅");
        } catch (e) {
            Alert.alert("Fehler", e.message);
        } finally {
            setIsUploading(false);
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
                        <TouchableOpacity style={styles.settingsItem}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="notifications-outline" size={22} color="white" style={{ marginRight: 15 }} /><Text style={styles.settingsItemText}>Benachrichtigungen</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
                        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Rechtliches</Text>
                        <TouchableOpacity style={styles.settingsItem}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="shield-checkmark-outline" size={22} color="white" style={{ marginRight: 15 }} /><Text style={styles.settingsItemText}>Datenschutz</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></TouchableOpacity>
                        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 30 }} />
                        <TouchableOpacity onPress={() => { onLogout(); setSettingsVisible(false); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="log-out-outline" size={24} color="#ff4d4d" /><Text style={{ color: '#ff4d4d', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>Abmelden</Text></TouchableOpacity>
                    </>)}
                    {settingsView === 'edit' && (<>
                        <TouchableOpacity onPress={pickSetupImage} style={{ alignSelf: 'center', marginVertical: 20 }}>{setupImageUri ? <Image source={{ uri: setupImageUri }} style={styles.setupAvatar} /> : <View style={styles.setupAvatarPlaceholder}><Ionicons name="camera" size={30} color="#666" /></View>}<Text style={{ color: THEME_COLOR, textAlign: 'center', marginTop: 10 }}>Foto ändern</Text></TouchableOpacity>
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
                <View style={[styles.profileHeader, { marginTop: 40, flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 20 }]}>
                    <TouchableOpacity onPress={() => setActiveCollectionId(null)}><Ionicons name="arrow-back" size={28} color="white" /></TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 15 }}>Ordner Inhalt</Text>
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

    let activeData = [];
    if (profileTab === 'uploads') activeData = myVideos;
    if (profileTab === 'likes') activeData = likedVideos;

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={styles.profileHeader}>
                {/* HEADER BUTTONS */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', paddingRight: 20 }}>
                    <TouchableOpacity style={{ marginRight: 20 }}>
                        <Ionicons name="share-social-outline" size={26} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openSettings}>
                        <Ionicons name="menu-outline" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center', marginTop: -10 }}>
                    <View style={{ marginBottom: 15 }}>
                        {myProfileData?.avatar_url ?
                            <Image source={{ uri: `${BASE_URL}${myProfileData.avatar_url}` }} style={styles.profileAvatar} /> :
                            <View style={styles.profileAvatarPlaceholder}><Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>{(myProfileData?.display_name || "U").charAt(0)}</Text></View>
                        }
                    </View>

                    <Text style={styles.profileName}>@{myProfileData?.display_name?.replace(/\s/g, '') || 'user'}</Text>

                    <View style={styles.profileStatsRow}>
                        <View style={styles.profileStatItem}><Text style={styles.profileStatNumber}>{myProfileData?.followers_count || 0}</Text><Text style={styles.profileStatLabel}>Follower</Text></View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.profileStatItem}><Text style={styles.profileStatNumber}>{myProfileData?.following_count || 0}</Text><Text style={styles.profileStatLabel}>Folge ich</Text></View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.profileStatItem}><Text style={styles.profileStatNumber}>{myVideos.length}</Text><Text style={styles.profileStatLabel}>Videos</Text></View>
                    </View>

                    <Text style={styles.profileBio}>{myProfileData?.bio || "Keine Bio vorhanden"}</Text>


                </View>
            </View>
            <View style={styles.tabContainer}>
                <TouchableOpacity onPress={() => setProfileTab('uploads')} style={[styles.tabItem, profileTab === 'uploads' && styles.activeTab]}><Ionicons name="grid-outline" size={24} color={profileTab === 'uploads' ? 'white' : '#666'} /></TouchableOpacity>
                <TouchableOpacity onPress={() => { setProfileTab('likes'); loadLikedVideos(); }} style={[styles.tabItem, profileTab === 'likes' && styles.activeTab]}><Ionicons name="heart-outline" size={24} color={profileTab === 'likes' ? 'white' : '#666'} /></TouchableOpacity>
                <TouchableOpacity onPress={() => { setProfileTab('saved'); setSavedViewType('all'); loadSavedVideosAll(); }} style={[styles.tabItem, profileTab === 'saved' && styles.activeTab]}><Ionicons name="bookmark-outline" size={24} color={profileTab === 'saved' ? 'white' : '#666'} /></TouchableOpacity>
            </View>

            {profileTab === 'saved' ? (
                <>
                    {/* SUB-TAB SWITCH FÜR SAVED */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}>
                        <TouchableOpacity onPress={() => { setSavedViewType('all'); loadSavedVideosAll(); }} style={{ paddingHorizontal: 20, paddingVertical: 5, backgroundColor: savedViewType === 'all' ? '#333' : 'transparent', borderRadius: 15 }}>
                            <Text style={{ color: savedViewType === 'all' ? 'white' : '#888', fontWeight: 'bold' }}>Alle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSavedViewType('folders'); fetchCollections(); }} style={{ paddingHorizontal: 20, paddingVertical: 5, backgroundColor: savedViewType === 'folders' ? '#333' : 'transparent', borderRadius: 15, marginLeft: 10 }}>
                            <Text style={{ color: savedViewType === 'folders' ? 'white' : '#888', fontWeight: 'bold' }}>Ordner</Text>
                        </TouchableOpacity>
                    </View>

                    {savedViewType === 'all' ? (
                        <FlatList
                            key={'saved-all'}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            data={savedVideos} numColumns={3}
                            renderItem={({ item }) => <TouchableOpacity onPress={() => { setSelectedRecipe(item); setModalVisible(true); }} style={styles.gridItem}><MiniVideo uri={item.video_url} style={{ width: '100%', height: '100%' }} /></TouchableOpacity>}
                            ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#666' }}>Noch nichts gespeichert.</Text></View>}
                        />
                    ) : (
                        <FlatList
                            key={'saved-folders'}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            data={collections || []}
                            numColumns={2}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => loadCollectionVideos(item.id)} style={styles.collectionItem}>
                                    <Ionicons name="folder" size={50} color={THEME_COLOR} />
                                    <Text style={{ color: 'white', marginTop: 5, fontWeight: 'bold' }}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#666' }}>Keine Ordner.</Text></View>}
                        />
                    )}
                </>
            ) : (
                <FlatList
                    key={'videos-grid-' + profileTab}
                    keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                    data={activeData} numColumns={3}
                    renderItem={({ item }) => <TouchableOpacity onPress={() => { setSelectedRecipe(item); setModalVisible(true); }} style={styles.gridItem}><MiniVideo uri={item.video_url} style={{ width: '100%', height: '100%' }} /></TouchableOpacity>}
                    ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#666' }}>Hier ist es noch leer.</Text></View>}
                />
            )}

            {renderSettingsModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    profileHeader: { width: '100%', paddingVertical: 20, paddingTop: 50, backgroundColor: 'black' },
    profileAvatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: THEME_COLOR },
    profileAvatarPlaceholder: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#333', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
    profileName: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 10, letterSpacing: 0.5 },
    profileStatsRow: { flexDirection: 'row', marginTop: 20, marginBottom: 15, alignItems: 'center' },
    profileStatItem: { alignItems: 'center', marginHorizontal: 15 },
    profileStatNumber: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    profileStatLabel: { color: '#888', fontSize: 13 },
    verticalDivider: { width: 1, height: 20, backgroundColor: '#333' },
    profileBio: { color: '#ddd', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
    editProfileBtn: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 140 },
    editProfileText: { color: 'white', fontWeight: '600', fontSize: 15 },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222' },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 15 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: THEME_COLOR },
    gridItem: { width: '33.33%', aspectRatio: 0.7, borderWidth: 1, borderColor: 'black' },
    collectionItem: { width: '45%', aspectRatio: 1, margin: '2.5%', backgroundColor: '#222', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    // Settings Modal Styles
    settingsHeader: { padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' },
    modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    sectionTitle: { color: '#888', fontSize: 14, textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
    settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
    settingsItemText: { color: 'white', fontSize: 16 },
    setupAvatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: THEME_COLOR },
    setupAvatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    modernInput: { backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white', padding: 15, marginBottom: 15, fontSize: 16 },
    primaryButton: { backgroundColor: THEME_COLOR, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default ProfileScreen;
