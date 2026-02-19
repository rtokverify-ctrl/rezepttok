import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLOR, BASE_URL } from '../constants/Config';

const { width } = Dimensions.get('window');

const VideoPost = ({ item, isActive, toggleLike, onSavePress, openModal, openComments, onChefPress, onFollowPress, currentScreen, containerHeight }) => {
    const [status, setStatus] = useState({});
    const player = useVideoPlayer(item.video_url, player => {
        player.loop = true;
    });

    useEffect(() => {
        if (isActive && currentScreen === 'feed') {
            try { player.play(); } catch (e) { }
        } else {
            try { player.pause(); } catch (e) { }
        }
    }, [isActive, currentScreen]);

    // Double tap like animation
    const [showHeart, setShowHeart] = useState(false);
    const scaleValue = useRef(new Animated.Value(0)).current;
    const lastTap = useRef(null);

    // Internal double tap handler
    const handleTap = () => {
        const now = Date.now();
        if (lastTap.current && (now - lastTap.current) < 300) {
            // Double tap!
            toggleLike(item.id); // Always toggle like, or check !item.is_liked if we only want to like
            setShowHeart(true);
            Animated.sequence([
                Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, friction: 5 }),
                Animated.timing(scaleValue, { toValue: 0, duration: 150, delay: 500, useNativeDriver: true })
            ]).start(() => setShowHeart(false));
        } else {
            // Single tap: toggle play/pause
            if (player.playing) player.pause(); else player.play();
        }
        lastTap.current = now;
    };

    return (
        <View style={{ width: width, height: containerHeight, backgroundColor: 'black' }}>
            <TouchableOpacity activeOpacity={1} onPress={handleTap} style={{ flex: 1 }}>
                <VideoView style={{ width: '100%', height: '100%' }} player={player} contentFit="cover" nativeControls={false} />
            </TouchableOpacity>

            {/* Heart Animation Overlay */}
            {showHeart && (
                <View style={styles.playIconOverlay} pointerEvents="none">
                    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                        <Ionicons name="heart" size={100} color={THEME_COLOR} />
                    </Animated.View>
                </View>
            )}

            {!player.playing && !showHeart && (
                <View style={styles.playIconOverlay} pointerEvents="none">
                    <Ionicons name="play" size={60} color="rgba(255,255,255,0.4)" />
                </View>
            )}

            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} style={styles.videoGradient} />

            <View style={styles.rightSidebar}>
                <TouchableOpacity onPress={() => onChefPress(item.owner_id)} style={[styles.actionButton, { marginBottom: 25 }]}>
                    {item.owner?.avatar_url ? <Image source={{ uri: `${BASE_URL}${item.owner.avatar_url}` }} style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'white' }} /> : <View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'white', backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{item.chef?.charAt(0)}</Text></View>}
                    {!item.owner?.i_follow && <TouchableOpacity onPress={() => onFollowPress(item.owner_id)} style={{ position: 'absolute', bottom: -10, backgroundColor: THEME_COLOR, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="add" size={14} color="white" /></TouchableOpacity>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionButton}>
                    <Ionicons name="heart" size={35} color={item.liked ? THEME_COLOR : 'white'} />
                    <Text style={styles.actionText}>{item.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openComments(item.id)} style={styles.actionButton}>
                    <Ionicons name="chatbubble-ellipses" size={35} color="white" />
                    <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => onSavePress(item)} style={styles.actionButton}>
                    <Ionicons name="bookmark" size={35} color={item.saved ? '#FFD700' : 'white'} />
                    <Text style={styles.actionText}>{item.saved ? "Gespeichert" : "Speichern"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openModal(item)} style={styles.actionButton}>
                    <MaterialCommunityIcons name="chef-hat" size={35} color="white" />
                    <Text style={styles.actionText}>Rezept</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.bottomInfo}>
                <Text style={styles.chefName}>@{item.chef}</Text>
                {item.tags && (
                    <View style={styles.tagRow}>
                        {item.tags.map((tag, idx) => (
                            <View key={idx} style={styles.miniTag}><Text style={styles.miniTagText}>#{tag}</Text></View>
                        ))}
                    </View>
                )}
                <Text style={styles.videoDescription} numberOfLines={2}>{item.title}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    videoGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250 },
    rightSidebar: { position: 'absolute', right: 10, bottom: 80, alignItems: 'center' }, // Adjusted bottom padding
    actionButton: { marginBottom: 20, alignItems: 'center' },
    actionText: { color: 'white', fontWeight: 'bold', fontSize: 13, textShadowColor: 'black', textShadowRadius: 5 },
    bottomInfo: { position: 'absolute', bottom: 15, left: 15, right: 80 },
    chefName: { color: 'white', fontWeight: 'bold', fontSize: 17, marginBottom: 4, textShadowColor: 'black', textShadowRadius: 5 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
    miniTag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 5, marginBottom: 2 },
    miniTagText: { color: 'white', fontSize: 11, fontWeight: '600' },
    videoDescription: { color: '#eee', fontSize: 15, lineHeight: 20, textShadowColor: 'black', textShadowRadius: 5 },
    playIconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
});

export default VideoPost;
