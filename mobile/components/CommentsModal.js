import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getFullUrl } from '../constants/Config';
import { useGlobal } from '../context/GlobalContext';

const CommentsModal = ({ visible, onClose, comments, loading, newComment, setNewComment, sendComment }) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

    const [replyingTo, setReplyingTo] = useState(null); // { id, username }
    const [expandedReplies, setExpandedReplies] = useState({}); // { commentId: true/false }

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

    // Count all comments including replies
    const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const handleReply = (comment) => {
        setReplyingTo({ id: comment.id, username: comment.username });
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const handleSend = () => {
        if (replyingTo) {
            sendComment(replyingTo.id);
            setReplyingTo(null);
        } else {
            sendComment(null);
        }
    };

    const renderCommentItem = (item, isReply = false) => (
        <View style={[styles.commentItem, isReply && styles.replyItem]} key={item.id}>
            {item.avatar ? (
                <Image source={{ uri: getFullUrl(item.avatar) }} style={[styles.commentAvatarImage, isReply && styles.replyAvatar]} />
            ) : (
                <View style={[styles.commentAvatar, isReply && styles.replyAvatar]}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: isReply ? 11 : 14 }}>{(item.username || "?").charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.commentUser}>{item.username || "Gast"}</Text>
                    <Text style={styles.commentTime}>{formatCommentDate(item.created_at)}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
                
                {/* Reply button + reply count (only for top-level) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 16 }}>
                    <TouchableOpacity onPress={() => handleReply(item)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.replyButton}>Antworten</Text>
                    </TouchableOpacity>
                    
                    {!isReply && item.replies?.length > 0 && (
                        <TouchableOpacity onPress={() => toggleReplies(item.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.replyLine} />
                            <Text style={styles.viewRepliesText}>
                                {expandedReplies[item.id] 
                                    ? 'Antworten ausblenden' 
                                    : `${item.replies.length} ${item.replies.length === 1 ? 'Antwort' : 'Antworten'} anzeigen`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: '65%' }]}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Kommentare ({totalCount})</Text>
                        <TouchableOpacity onPress={() => { cancelReply(); onClose(); }}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator color={themeColor} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            data={comments}
                            renderItem={({ item }) => (
                                <View>
                                    {renderCommentItem(item, false)}
                                    {/* Threaded replies */}
                                    {expandedReplies[item.id] && item.replies?.map(reply => 
                                        renderCommentItem(reply, true)
                                    )}
                                </View>
                            )}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>Schreib den ersten Kommentar!</Text>}
                        />
                    )}

                    {/* Reply indicator */}
                    {replyingTo && (
                        <View style={styles.replyIndicator}>
                            <Text style={styles.replyIndicatorText}>
                                Antwort an <Text style={{ fontWeight: 'bold', color: themeColor }}>@{replyingTo.username}</Text>
                            </Text>
                            <TouchableOpacity onPress={cancelReply}>
                                <Ionicons name="close-circle" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder={replyingTo ? `Antwort an @${replyingTo.username}...` : "Kommentar hinzufügen..."}
                            placeholderTextColor="#999"
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                            <Ionicons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    
    commentItem: { flexDirection: 'row', padding: 15, paddingBottom: 8, borderBottomWidth: 0 },
    replyItem: { paddingLeft: 55, paddingTop: 8, paddingBottom: 8 },
    
    commentAvatar: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    commentAvatarImage: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
    replyAvatar: { width: 28, height: 28, borderRadius: 14 },
    
    commentUser: { fontWeight: 'bold', fontSize: 14, color: 'white', marginRight: 8 },
    commentTime: { color: '#888', fontSize: 12 },
    commentText: { color: '#ddd', marginTop: 4, fontSize: 15 },
    
    replyButton: { color: '#888', fontSize: 12, fontWeight: '600' },
    viewRepliesText: { color: '#888', fontSize: 12, fontWeight: '600' },
    replyLine: { width: 20, height: 1, backgroundColor: '#555', marginRight: 8 },
    
    replyIndicator: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 8, 
        backgroundColor: 'rgba(255,255,255,0.05)', borderTopWidth: 1, borderTopColor: '#222'
    },
    replyIndicatorText: { color: '#aaa', fontSize: 13 },
    
    commentInputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#222', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 25 : 12, backgroundColor: '#0a0a0a' },
    commentInput: { flex: 1, backgroundColor: '#222', color: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, fontSize: 15 },
    sendButton: { backgroundColor: themeColor, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});

export default CommentsModal;
