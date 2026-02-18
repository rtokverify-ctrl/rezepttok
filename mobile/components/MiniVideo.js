import React, { useRef, useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const MiniVideo = ({ uri, style }) => {
    const player = useVideoPlayer(uri, player => {
        player.loop = true;
        player.muted = true;
        try { player.play(); } catch (e) { }
    });
    return (
        <View style={[style, { overflow: 'hidden', borderRadius: 10 }]}>
            <VideoView style={{ width: '100%', height: '100%' }} player={player} contentFit="cover" nativeControls={false} />
        </View>
    );
};

export default MiniVideo;
