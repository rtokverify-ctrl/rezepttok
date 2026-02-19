import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Dimensions, Animated, Easing, Platform, PanResponder } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLOR, BASE_URL, getFullUrl } from '../constants/Config';

const { width } = Dimensions.get('window');

const VideoPost = ({ item, isActive, toggleLike, onSavePress, openModal, openComments, onChefPress, onFollowPress, currentScreen, containerHeight }) => {
    const [userPaused, setUserPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const seekBarRef = useRef(null);
    const seekBarWidth = useRef(0);
    const wasPlayingBeforeSeek = useRef(false);

    const player = useVideoPlayer(item.video_url, player => {
        player.loop = true;
        player.muted = true;
    });

    // Sync play/pause with isActive and currentScreen
    useEffect(() => {
        if (!player) return;
        const shouldPlay = isActive && currentScreen === 'feed' && !userPaused;

        if (shouldPlay) {
            try { player.play(); } catch (e) { }
        } else {
            try { player.pause(); } catch (e) { }
        }
    }, [isActive, currentScreen, userPaused, player]);

    // Reset userPaused when scrolling to a new video
    useEffect(() => {
        if (isActive) {
            setUserPaused(false);
        }
    }, [isActive]);

    // Track time & duration via polling (expo-video events are unreliable on web)
    useEffect(() => {
        if (!player || !isActive) return;

        const interval = setInterval(() => {
            try {
                if (!isSeeking) {
                    const t = player.currentTime || 0;
                    const d = player.duration || 0;
                    setCurrentTime(t);
                    if (d > 0) setDuration(d);
                }
            } catch (e) { /* player may not be ready */ }
        }, 250);

        return () => clearInterval(interval);
    }, [player, isActive, isSeeking]);

    // Seek bar touch handling
    const handleSeekStart = useCallback((locationX) => {
        if (seekBarWidth.current <= 0 || duration <= 0) return;
        setIsSeeking(true);
        wasPlayingBeforeSeek.current = !userPaused;
        try { player.pause(); } catch (e) { }

        const progress = Math.max(0, Math.min(1, locationX / seekBarWidth.current));
        const seekTo = progress * duration;
        setCurrentTime(seekTo);
    }, [duration, player, userPaused]);

    const handleSeekMove = useCallback((locationX) => {
        if (seekBarWidth.current <= 0 || duration <= 0 || !isSeeking) return;
        const progress = Math.max(0, Math.min(1, locationX / seekBarWidth.current));
        setCurrentTime(progress * duration);
    }, [duration, isSeeking]);

    const handleSeekEnd = useCallback(() => {
        if (!isSeeking || duration <= 0) return;
        try {
            player.currentTime = currentTime;
            if (wasPlayingBeforeSeek.current) {
                player.play();
                setUserPaused(false);
            }
        } catch (e) { }
        setIsSeeking(false);
    }, [isSeeking, currentTime, duration, player]);

    // Double tap like animation
    const [showHeart, setShowHeart] = useState(false);
    const scaleValue = useRef(new Animated.Value(0)).current;
    const lastTap = useRef(null);

    const handleTap = () => {
        const now = Date.now();
        if (lastTap.current && (now - lastTap.current) < 300) {
            // Double tap — like
            toggleLike(item.id);
            setShowHeart(true);
            Animated.sequence([
                Animated.spring(scaleValue, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 5 }),
                Animated.timing(scaleValue, { toValue: 0, duration: 150, delay: 500, useNativeDriver: Platform.OS !== 'web' })
            ]).start(() => setShowHeart(false));
        } else {
            // Single tap — toggle play/pause
            if (userPaused) {
                try { player.play(); } catch (e) { }
                setUserPaused(false);
            } else {
                try { player.pause(); } catch (e) { }
                setUserPaused(true);
            }
        }
        lastTap.current = now;
    };

    const progress = duration > 0 ? currentTime / duration : 0;

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

            {userPaused && !showHeart && (
                <View style={styles.playIconOverlay} pointerEvents="none">
                    <Ionicons name="play" size={60} color="rgba(255,255,255,0.4)" />
                </View>
            )}

            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} style={styles.videoGradient} />

            {/* Seekbar */}
            <View
                style={styles.seekBarContainer}
                ref={seekBarRef}
                onLayout={(e) => { seekBarWidth.current = e.nativeEvent.layout.width; }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => handleSeekStart(e.nativeEvent.locationX)}
                onResponderMove={(e) => handleSeekMove(e.nativeEvent.locationX)}
                onResponderRelease={handleSeekEnd}
                onResponderTerminate={handleSeekEnd}
            >
                <View style={styles.seekBarTrack}>
                    <View style={[styles.seekBarFill, { width: `${progress * 100}%` }]} />
                    <View style={[styles.seekBarThumb, { left: `${progress * 100}%` }]} />
                </View>
            </View>

            <View style={styles.rightSidebar}>
                <TouchableOpacity onPress={() => onChefPress(item.owner_id)} style={[styles.actionButton, { marginBottom: 25 }]}>
                    {item.owner?.avatar_url ? <Image source={{ uri: getFullUrl(item.owner.avatar_url) }} style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'white' }} /> : <View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'white', backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{item.chef?.charAt(0)}</Text></View>}
                    {!item.owner?.i_follow && <TouchableOpacity onPress={() => onFollowPress(item.owner_id)} style={{ position: 'absolute', bottom: -10, backgroundColor: THEME_COLOR, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="add" size={14} color="white" /></TouchableOpacity>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionButton}>
                    <Ionicons name="heart" size={35} color={item.is_liked ? THEME_COLOR : 'white'} />
                    <Text style={styles.actionText}>{item.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openComments && openComments(item.id)} style={styles.actionButton}>
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
    rightSidebar: { position: 'absolute', right: 10, bottom: 80, alignItems: 'center' },
    actionButton: { marginBottom: 20, alignItems: 'center' },
    actionText: { color: 'white', fontWeight: 'bold', fontSize: 13, textShadowColor: 'black', textShadowRadius: 5 },
    bottomInfo: { position: 'absolute', bottom: 15, left: 15, right: 80 },
    chefName: { color: 'white', fontWeight: 'bold', fontSize: 17, marginBottom: 4, textShadowColor: 'black', textShadowRadius: 5 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
    miniTag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 5, marginBottom: 2 },
    miniTagText: { color: 'white', fontSize: 11, fontWeight: '600' },
    videoDescription: { color: '#eee', fontSize: 15, lineHeight: 20, textShadowColor: 'black', textShadowRadius: 5 },
    playIconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    // Seekbar styles
    seekBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 24,        // Generous touch target
        justifyContent: 'center',
        zIndex: 10,
        paddingHorizontal: 0,
    },
    seekBarTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 1.5,
        position: 'relative',
    },
    seekBarFill: {
        height: '100%',
        backgroundColor: THEME_COLOR,
        borderRadius: 1.5,
    },
    seekBarThumb: {
        position: 'absolute',
        top: -5,
        width: 13,
        height: 13,
        borderRadius: 6.5,
        backgroundColor: THEME_COLOR,
        marginLeft: -6.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3,
    },
});

export default VideoPost;
