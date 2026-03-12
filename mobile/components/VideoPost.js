import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLOR, BASE_URL, getFullUrl } from '../constants/Config';

const { width } = Dimensions.get('window');

const VideoPost = ({ item, isActive, toggleLike, onSavePress, openModal, openComments, onChefPress, onFollowPress, containerHeight }) => {
    const [userPaused, setUserPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const seekBarRef = useRef(null);
    const seekBarWidth = useRef(0);
    const isDragging = useRef(false);

    const player = useVideoPlayer(item.video_url, p => {
        p.loop = true;
        p.muted = true;
        p.timeUpdateEventInterval = 0.25; // 250ms updates
    });

    // Play/pause based on visibility and user state
    useEffect(() => {
        if (!player) return;
        if (isActive && !userPaused) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, userPaused, player]);

    // Reset pause when scrolling to new video
    useEffect(() => {
        if (isActive) setUserPaused(false);
    }, [isActive]);

    // Track time via polling (most reliable on web)
    useEffect(() => {
        if (!player || !isActive) return;
        const interval = setInterval(() => {
            if (isDragging.current) return;
            try {
                const d = player.duration;
                const t = player.currentTime;
                if (d && !isNaN(d) && d > 0) setDuration(d);
                if (t !== undefined && !isNaN(t)) setCurrentTime(t);
            } catch (e) { }
        }, 200);
        return () => clearInterval(interval);
    }, [player, isActive]);

    // --- TAP HANDLER ---
    const lastTap = useRef(0);
    const [showHeart, setShowHeart] = useState(false);
    const scaleValue = useRef(new Animated.Value(0)).current;

    const handleVideoTap = useCallback(() => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            // Double tap = like
            toggleLike(item.id);
            setShowHeart(true);
            Animated.sequence([
                Animated.spring(scaleValue, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 5 }),
                Animated.timing(scaleValue, { toValue: 0, duration: 150, delay: 500, useNativeDriver: Platform.OS !== 'web' })
            ]).start(() => setShowHeart(false));
        } else {
            // Single tap = toggle play/pause state variable
            setUserPaused(prev => !prev);
        }
        lastTap.current = now;
    }, [item.id, toggleLike, scaleValue]);

    // --- SEEKBAR (web: mouse events, native: responder) ---
    const seekbarActive = useRef(new Animated.Value(0)).current;

    const animateSeekbar = useCallback((active) => {
        Animated.timing(seekbarActive, { toValue: active ? 1 : 0, duration: 150, useNativeDriver: false }).start();
    }, [seekbarActive]);

    const seekTo = useCallback((locationX) => {
        if (seekBarWidth.current <= 0 || !duration || duration <= 0) return;
        const p = Math.max(0, Math.min(1, locationX / seekBarWidth.current));
        const time = p * duration;
        setCurrentTime(time);
        try { player.currentTime = time; } catch (e) { }
    }, [duration, player]);

    // Web mouse events
    const handleMouseDown = useCallback((e) => {
        isDragging.current = true;
        animateSeekbar(true);
        try { player.pause(); } catch (ex) { }
        const rect = e.currentTarget.getBoundingClientRect();
        seekTo(e.clientX - rect.left);

        const onMouseMove = (ev) => seekTo(ev.clientX - rect.left);
        const onMouseUp = () => {
            isDragging.current = false;
            animateSeekbar(false);
            if (!userPaused) { try { player.play(); } catch (ex) { } }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [player, seekTo, userPaused, animateSeekbar]);

    const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

    // Web-compatible seekbar props
    const seekBarEvents = Platform.OS === 'web' ? {
        onMouseDown: handleMouseDown,
    } : {
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onResponderGrant: (e) => {
            isDragging.current = true;
            animateSeekbar(true);
            try { player.pause(); } catch (ex) { }
            seekTo(e.nativeEvent.locationX);
        },
        onResponderMove: (e) => seekTo(e.nativeEvent.locationX),
        onResponderRelease: () => {
            isDragging.current = false;
            animateSeekbar(false);
            if (!userPaused) try { player.play(); } catch (ex) { }
        },
        onResponderTerminate: () => {
            isDragging.current = false;
            animateSeekbar(false);
            if (!userPaused) try { player.play(); } catch (ex) { }
        },
    };

    const trackHeight = seekbarActive.interpolate({ inputRange: [0, 1], outputRange: [2, 6] });
    const thumbSize = seekbarActive.interpolate({ inputRange: [0, 1], outputRange: [6, 16] });
    const thumbMarginLeft = seekbarActive.interpolate({ inputRange: [0, 1], outputRange: [-3, -8] });
    // Adjust thumb to sit exactly vertically centered on the track
    const trackCenterY = seekbarActive.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });
    const thumbBottom = seekbarActive.interpolate({ 
        inputRange: [0, 1], 
        outputRange: [-2, -5] // Calculate: (thumbSize - trackHeight)/2
    });

    return (
        <View style={{ width: width, height: containerHeight, backgroundColor: 'black' }}>
            {/* Tap area over the video */}
            <Pressable onPress={handleVideoTap} style={{ flex: 1 }}>
                <VideoView
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                    player={player}
                    contentFit="cover"
                    nativeControls={false}
                />
            </Pressable>

            {/* Heart animation */}
            {showHeart && (
                <View style={styles.overlay} pointerEvents="none">
                    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                        <Ionicons name="heart" size={100} color={THEME_COLOR} />
                    </Animated.View>
                </View>
            )}

            {/* Pause icon */}
            {userPaused && !showHeart && (
                <View style={styles.overlay} pointerEvents="none">
                    <Ionicons name="play" size={60} color="rgba(255,255,255,0.4)" />
                </View>
            )}

            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} style={styles.videoGradient} />

            {/* Seekbar — interactive and animated */}
            <View
                ref={seekBarRef}
                style={styles.seekBarContainer}
                onLayout={(e) => { seekBarWidth.current = e.nativeEvent.layout.width; }}
                {...seekBarEvents}
            >
                <Animated.View style={[styles.seekBarTrack, { height: trackHeight }]}>
                    <View style={[styles.seekBarFill, { width: `${progress * 100}%` }]} />
                </Animated.View>
                <Animated.View style={[styles.seekBarThumb, { 
                    left: `${Math.max(0, progress * 100)}%`,
                    width: thumbSize,
                    height: thumbSize,
                    borderRadius: 20,
                    marginLeft: thumbMarginLeft,
                    bottom: thumbBottom
                }]} />
            </View>

            {/* Right sidebar actions */}
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

            {/* Bottom info */}
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
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    // Seekbar overrides for exact TikTok look
    seekBarContainer: {
        position: 'absolute',
        bottom: 0,  // Flush entirely to the bottom
        left: 0,
        right: 0,
        height: 20, // Large invisible hit area for easy tapping
        justifyContent: 'flex-end', // Aligns track to the very bottom
        paddingBottom: 0,
        zIndex: 20,
    },
    seekBarTrack: {
        backgroundColor: 'rgba(255,255,255,0.2)', // Slightly more transparent track
        position: 'relative',
        height: 4, // Thin track like tiktok
        width: '100%',
    },
    seekBarFill: {
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.9)', // White fill for the current progress like tiktok
    },
    seekBarThumb: {
        position: 'absolute',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3,
    },
});

export default VideoPost;
