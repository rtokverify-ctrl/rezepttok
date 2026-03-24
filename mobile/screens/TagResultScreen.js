import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    FlatList, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR } from '../constants/Config';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_COLS = 2;
const TILE_SIZE = (width - (32 + GRID_GAP)) / GRID_COLS;

const TagResultScreen = ({ userToken, tag, onBack }) => {
    const [recipes, setRecipes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTagRecipes();
    }, [tag]);

    const fetchTagRecipes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/recipes/tags/${encodeURIComponent(tag)}`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const data = await res.json();
            if (data.data) {
                setRecipes(data.data);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };

    const renderVideoTile = ({ item }) => (
        <TouchableOpacity style={styles.videoTile} activeOpacity={0.8}>
            <View style={styles.videoTileInner}>
                <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" style={{ position: 'absolute', top: 10, right: 10 }} />
                <Text style={styles.videoTileTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            <View style={styles.videoTileLikes}>
                <Ionicons name="play" size={14} color="white" />
                <Text style={styles.videoTileLikesText}>{item.views || item.likes_count || 0}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>#{tag}</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : recipes.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="fast-food-outline" size={60} color="#333" />
                    <Text style={styles.noResultsTitle}>Keine Rezepte</Text>
                    <Text style={styles.noResultsSubtitle}>Keine Rezepte zum Tag "{tag}" gefunden</Text>
                </View>
            ) : (
                <FlatList
                    data={recipes}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
                    renderItem={renderVideoTile}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { 
        paddingTop: 55, paddingHorizontal: 16, paddingBottom: 15,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: '#1a1a1a'
    },
    backButton: { padding: 4 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noResultsTitle: { color: '#555', fontSize: 20, fontWeight: '600', marginTop: 16 },
    noResultsSubtitle: { color: '#444', fontSize: 14, marginTop: 6 },
    videoTile: {
        width: TILE_SIZE, height: TILE_SIZE * 1.33,
        backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    videoTileInner: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 8, position: 'relative' },
    videoTileTitle: { color: '#ccc', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 6, opacity: 0.5 },
    videoTileLikes: {
        position: 'absolute', bottom: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    videoTileLikesText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});

export default TagResultScreen;
