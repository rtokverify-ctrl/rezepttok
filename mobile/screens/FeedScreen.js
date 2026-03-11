import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, Animated, StyleSheet, Dimensions, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import VideoPost from '../components/VideoPost';
import { THEME_COLOR } from '../constants/Config';

const { width, height } = Dimensions.get('window');

// ── Skeleton Loader ─────────────────────────────────────────────────
const SkeletonPulse = ({ style }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return <Animated.View style={[{ backgroundColor: '#222', borderRadius: 8 }, style, { opacity }]} />;
};

const FeedSkeleton = () => (
    <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        {/* Video placeholder */}
        <SkeletonPulse style={{ width: width * 0.9, height: height * 0.6, borderRadius: 16, marginBottom: 20 }} />
        {/* Bottom info */}
        <View style={{ alignSelf: 'flex-start', paddingLeft: 20 }}>
            <SkeletonPulse style={{ width: 120, height: 16, marginBottom: 10 }} />
            <SkeletonPulse style={{ width: 200, height: 12, marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <SkeletonPulse style={{ width: 60, height: 20, borderRadius: 10 }} />
                <SkeletonPulse style={{ width: 50, height: 20, borderRadius: 10 }} />
                <SkeletonPulse style={{ width: 70, height: 20, borderRadius: 10 }} />
            </View>
        </View>
        {/* Right sidebar placeholders */}
        <View style={{ position: 'absolute', right: 20, bottom: height * 0.2, alignItems: 'center' }}>
            <SkeletonPulse style={{ width: 44, height: 44, borderRadius: 22, marginBottom: 20 }} />
            <SkeletonPulse style={{ width: 36, height: 36, borderRadius: 8, marginBottom: 20 }} />
            <SkeletonPulse style={{ width: 36, height: 36, borderRadius: 8, marginBottom: 20 }} />
            <SkeletonPulse style={{ width: 36, height: 36, borderRadius: 8 }} />
        </View>
    </View>
);

// ── Empty State ─────────────────────────────────────────────────────
const EmptyFeed = ({ onRefresh }) => (
    <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={80} color="#333" />
        <Text style={styles.emptyTitle}>Noch keine Rezepte</Text>
        <Text style={styles.emptySubtitle}>Folge anderen Köchen oder lade dein erstes Rezept hoch!</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.refreshButtonText}>Aktualisieren</Text>
        </TouchableOpacity>
    </View>
);

// ── Main Feed Screen ────────────────────────────────────────────────
const FeedScreen = ({
    videos, toggleLike, handleGlobalSave, setSelectedRecipe,
    setModalVisible, onOpenComments, onChefPress, toggleFollowInFeed,
    setCurrentScreen, loadFeed, feedLoading
}) => {
    const [feedHeight, setFeedHeight] = useState(0);
    const [viewableItemIndex, setViewableItemIndex] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const isFocused = useIsFocused();

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) setViewableItemIndex(viewableItems[0].index);
    }).current;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (loadFeed) await loadFeed(true);
        setRefreshing(false);
    }, [loadFeed]);

    // Show skeleton on initial load
    if (feedLoading && videos.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <TouchableOpacity onPress={() => setCurrentScreen('search')} style={styles.searchButton}>
                    <Ionicons name="search" size={24} color="white" />
                </TouchableOpacity>
                <FeedSkeleton />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }} onLayout={(event) => { const { height } = event.nativeEvent.layout; setFeedHeight(height); }}>
            <TouchableOpacity onPress={() => setCurrentScreen('search')} style={styles.searchButton}>
                <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
            {feedHeight > 0 && (
                videos.length > 0 ? (
                    <FlatList
                        keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                        data={videos} pagingEnabled showsVerticalScrollIndicator={false}
                        snapToInterval={feedHeight} decelerationRate="fast"
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 95 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={THEME_COLOR}
                                colors={[THEME_COLOR]}
                                progressBackgroundColor="#111"
                            />
                        }
                        renderItem={({ item, index }) => (
                            <VideoPost
                                item={item} isActive={index === viewableItemIndex}
                                toggleLike={toggleLike} onSavePress={handleGlobalSave}
                                openModal={(itm) => { setSelectedRecipe(itm); setModalVisible(true); }} openComments={onOpenComments}
                                onChefPress={onChefPress} onFollowPress={toggleFollowInFeed}
                                containerHeight={feedHeight}
                            />
                        )}
                    />
                ) : !feedLoading ? (
                    <EmptyFeed onRefresh={onRefresh} />
                ) : (
                    <FeedSkeleton />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    searchButton: {
        position: 'absolute', top: 50, right: 20, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20,
    },
    emptyContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
    },
    emptyTitle: {
        color: '#555', fontSize: 22, fontWeight: '700', marginTop: 16,
    },
    emptySubtitle: {
        color: '#444', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20,
    },
    refreshButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 24, backgroundColor: THEME_COLOR, paddingHorizontal: 20,
        paddingVertical: 12, borderRadius: 24,
    },
    refreshButtonText: {
        color: 'white', fontWeight: '600', fontSize: 15,
    },
});

export default FeedScreen;
