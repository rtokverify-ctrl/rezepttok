import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR, getFullUrl } from '../constants/Config';
import MiniVideo from './MiniVideo';

const { width } = Dimensions.get('window');

const UserProfileModal = ({ visible, onClose, userProfileData, userProfileVideos, toggleFollowOnProfile, setSelectedRecipe, setModalVisible }) => {
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: '85%' }]}>
                    <View style={styles.modalHandle} />
                    <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 15, top: 15, zIndex: 10 }}>
                        <Ionicons name="close" size={26} color="black" />
                    </TouchableOpacity>
                    {userProfileData && (
                        <ScrollView>
                            <View style={{ alignItems: 'center', paddingTop: 30, paddingBottom: 15 }}>
                                {userProfileData.avatar_url ? (
                                    <Image source={{ uri: getFullUrl(userProfileData.avatar_url) }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                                ) : (
                                    <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#666' }}>{(userProfileData.display_name || 'U').charAt(0)}</Text>
                                    </View>
                                )}
                                <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 12, color: '#111' }}>{userProfileData.display_name}</Text>
                                <Text style={{ color: '#888', marginTop: 2 }}>@{userProfileData.username}</Text>
                                <View style={{ flexDirection: 'row', marginTop: 15 }}>
                                    <View style={{ alignItems: 'center', marginHorizontal: 20 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111' }}>{userProfileData.followers_count || 0}</Text>
                                        <Text style={{ color: '#888', fontSize: 12 }}>Follower</Text>
                                    </View>
                                    <View style={{ alignItems: 'center', marginHorizontal: 20 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111' }}>{userProfileData.following_count || 0}</Text>
                                        <Text style={{ color: '#888', fontSize: 12 }}>Folge ich</Text>
                                    </View>
                                    <View style={{ alignItems: 'center', marginHorizontal: 20 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111' }}>{userProfileVideos.length}</Text>
                                        <Text style={{ color: '#888', fontSize: 12 }}>Videos</Text>
                                    </View>
                                </View>
                                {userProfileData.bio ? <Text style={{ color: '#555', marginTop: 12, textAlign: 'center', paddingHorizontal: 30 }}>{userProfileData.bio}</Text> : null}
                                {!userProfileData.is_me && (
                                    <TouchableOpacity onPress={toggleFollowOnProfile} style={[styles.followBtn, userProfileData.i_follow && styles.followBtnActive]}>
                                        <Text style={[styles.followBtnText, userProfileData.i_follow && styles.followBtnTextActive]}>{userProfileData.i_follow ? 'Folgst du' : 'Folgen'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={{ borderTopWidth: 1, borderTopColor: '#eee' }}>
                                <FlatList
                                    scrollEnabled={false}
                                    keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                                    data={userProfileVideos} numColumns={3}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity onPress={() => { onClose(); setSelectedRecipe(item); setModalVisible(true); }} style={{ width: width / 3, height: 180, borderColor: '#eee', borderWidth: 0.5 }}>
                                            <MiniVideo uri={item.video_url} style={{ width: '100%', height: '100%' }} />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#888' }}>Noch keine Videos.</Text></View>}
                                />
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    followBtn: { marginTop: 15, paddingHorizontal: 40, paddingVertical: 10, borderRadius: 8, backgroundColor: THEME_COLOR },
    followBtnActive: { backgroundColor: '#eee' },
    followBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    followBtnTextActive: { color: '#333' },
});

export default UserProfileModal;
