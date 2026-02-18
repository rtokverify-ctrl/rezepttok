import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR } from '../constants/Config';

const CommentsModal = ({ visible, onClose, comments, loading, newComment, setNewComment, sendComment }) => {

    // Helper to format date
    const formatCommentDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const now = new Date();
        const diffMs = now - d;
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHr = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHr / 24);
        if (diffSec < 60) return 'gerade eben';
        if (diffMin < 60) return `${diffMin} min`;
        if (diffHr < 24) return `${diffHr} Std`;
        if (diffDay < 7) return `${diffDay} d`;
        return d.toLocaleDateString();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: '60%' }]}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Kommentare ({comments.length})</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator color={THEME_COLOR} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            data={comments}
                            renderItem={({ item }) => (
                                <View style={styles.commentItem}>
                                    {item.avatar ? (
                                        <Image source={{ uri: `${BASE_URL}${item.avatar}` }} style={styles.commentAvatarImage} />
                                    ) : (
                                        <View style={styles.commentAvatar}>
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.username.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.commentUser}>{item.username}</Text>
                                            <Text style={styles.commentTime}>{formatCommentDate(item.created_at)}</Text>
                                        </View>
                                        <Text style={styles.commentText}>{item.text}</Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>Schreib den ersten Kommentar!</Text>}
                        />
                    )}
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Kommentar hinzufügen..."
                            placeholderTextColor="#999"
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <TouchableOpacity onPress={sendComment} style={styles.sendButton}>
                            <Ionicons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    commentItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    commentAvatar: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    commentAvatarImage: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
    commentUser: { fontWeight: 'bold', fontSize: 14, color: '#333', marginRight: 5 },
    commentTime: { color: '#999', fontSize: 12 },
    commentText: { color: '#444', marginTop: 2, fontSize: 15 },
    commentInputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center', paddingBottom: 25 },
    commentInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, fontSize: 16 },
    sendButton: { backgroundColor: THEME_COLOR, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});

export default CommentsModal;
