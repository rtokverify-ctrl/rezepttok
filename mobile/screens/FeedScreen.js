import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, Animated, StyleSheet, Dimensions, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import VideoPost from '../components/VideoPost';
import {  } from '../constants/Config';
import { useGlobal } from '../context/GlobalContext';

const { width, height } = Dimensions.get('window');

// ── Skeleton Loader ─────────────────────────────────────────────────
const SkeletonPulse = ({ style }) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

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
    setCurrentScreen, loadFeed, feedLoading, nextCursor
}) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

    const [feedHeight, setFeedHeight] = useState(0);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const isFocused = useIsFocused();

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        const visibleItem = viewableItems.find(item => item.isViewable);
        if (visibleItem != null && visibleItem.index != null) {
            setActiveVideoIndex(visibleItem.index);
        }
    }).current;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (loadFeed) await loadFeed(true);
        setRefreshing(false);
    }, [loadFeed]);

    const handleLoadMore = useCallback(() => {
        if (nextCursor && loadFeed) {
            loadFeed(false, nextCursor);
        }
    }, [nextCursor, loadFeed]);

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }} onLayout={(event) => { const { height } = event.nativeEvent.layout; setFeedHeight(height); }}>
            
            {/* Top Navigation */}
            <View style={styles.topNavContainer}>
                <TouchableOpacity>
                    <Text style={styles.topNavTextInactive}>Folge ich</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.topNavActiveContainer}>
                    <Text style={styles.topNavTextActive}>Für dich</Text>
                    <View style={styles.topNavActiveIndicator} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setCurrentScreen('search')} style={styles.searchButton}>
                <Ionicons name="search" size={22} color="white" />
            </TouchableOpacity>

            {feedLoading && videos.length === 0 ? (
                <FeedSkeleton />
            ) : videos.length > 0 ? (
                feedHeight > 0 ? (
                    <FlatList
                        keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                        data={videos} pagingEnabled showsVerticalScrollIndicator={false}
                        snapToInterval={feedHeight} decelerationRate="fast"
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 100 }}
                        windowSize={3}
                        maxToRenderPerBatch={2}
                        updateCellsBatchingPeriod={50}
                        initialNumToRender={2}
                        removeClippedSubviews={true}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        onScrollBeginDrag={() => setIsScrolling(true)}
                        onMomentumScrollEnd={() => setIsScrolling(false)}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={themeColor}
                                colors={[themeColor]}
                                progressBackgroundColor="#111"
                            />
                        }
                        renderItem={({ item, index }) => (
                            <VideoPost
                                item={item} isActive={index === activeVideoIndex && !isScrolling && isFocused}
                                toggleLike={toggleLike} onSavePress={handleGlobalSave}
                                openModal={(itm) => { setSelectedRecipe(itm); setModalVisible(true); }} openComments={onOpenComments}
                                onChefPress={onChefPress} onFollowPress={toggleFollowInFeed}
                                containerHeight={feedHeight}
                            />
                        )}
                    />
                ) : null
            ) : (
                <EmptyFeed onRefresh={onRefresh} />
            )}
        </View>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    topNavContainer: {
        position: 'absolute', top: 55, left: 0, right: 0, zIndex: 50,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24,
    },
    topNavTextInactive: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 16 },
    topNavTextActive: { color: 'white', fontWeight: 'bold', fontSize: 18, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 },
    topNavActiveContainer: { alignItems: 'center', position: 'relative' },
    topNavActiveIndicator: { position: 'absolute', bottom: -8, width: 16, height: 4, backgroundColor: 'white', borderRadius: 2 },
    searchButton: {
        position: 'absolute', top: 48, right: 16, zIndex: 50,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center'
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
        marginTop: 24, backgroundColor: themeColor, paddingHorizontal: 20,
        paddingVertical: 12, borderRadius: 24,
    },
    refreshButtonText: {
        color: 'white', fontWeight: '600', fontSize: 15,
    },
});

export default FeedScreen;
