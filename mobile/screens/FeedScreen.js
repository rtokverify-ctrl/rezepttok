import React, { useState, useRef } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import VideoPost from '../components/VideoPost';
import { THEME_COLOR } from '../constants/Config';

const FeedScreen = ({ videos, toggleLike, handleGlobalSave, setSelectedRecipe, setModalVisible, onOpenComments, onChefPress, toggleFollowInFeed, setCurrentScreen }) => {
    const [feedHeight, setFeedHeight] = useState(0);
    const [viewableItemIndex, setViewableItemIndex] = useState(0);
    const isFocused = useIsFocused();

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) setViewableItemIndex(viewableItems[0].index);
    }).current;

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }} onLayout={(event) => { const { height } = event.nativeEvent.layout; setFeedHeight(height); }}>
            <TouchableOpacity onPress={() => setCurrentScreen('search')} style={{ position: 'absolute', top: 50, right: 20, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 }}>
                <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
            {feedHeight > 0 && (
                <FlatList
                    keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                    data={videos} pagingEnabled showsVerticalScrollIndicator={false}
                    snapToInterval={feedHeight} decelerationRate="fast" onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={{ itemVisiblePercentThreshold: 95 }}
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
            )}
        </View>
    );
};

export default FeedScreen;
