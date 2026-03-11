import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, TextInput,
    FlatList, Image, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR, getFullUrl } from '../constants/Config';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLS = 3;
const TILE_SIZE = (width - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

const TRENDING_TAGS = ['Pasta', 'Vegan', 'Dessert', 'Schnell', 'Asiatisch', 'Salat', 'Deutsch', 'Backen'];

const SearchScreen = ({ userToken, navigation, onChefPress }) => {
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState({ users: [], videos: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (query) => {
        const q = query || searchText;
        if (!q.trim()) return;
        setIsSearching(true);
        setHasSearched(true);
        try {
            const r = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(q)}`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const d = await r.json();
            setSearchResults({
                users: Array.isArray(d.users) ? d.users : [],
                videos: Array.isArray(d.videos) ? d.videos : [],
            });
        } catch (e) {
            console.log(e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleTagPress = (tag) => {
        setSearchText(tag);
        handleSearch(tag);
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => onChefPress && onChefPress(item.id)}
            activeOpacity={0.7}
        >
            {item.avatar_url ? (
                <Image source={{ uri: getFullUrl(item.avatar_url) }} style={styles.userAvatar} />
            ) : (
                <View style={styles.userAvatarPlaceholder}>
                    <Text style={styles.userAvatarLetter}>
                        {(item.display_name || item.username || '?').charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={styles.userInfo}>
                <Text style={styles.userDisplayName}>{item.display_name || item.username}</Text>
                <Text style={styles.userUsername}>@{item.username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#444" />
        </TouchableOpacity>
    );

    const renderVideoTile = ({ item }) => (
        <TouchableOpacity style={styles.videoTile} activeOpacity={0.8}>
            <View style={styles.videoTileInner}>
                <Ionicons name="play" size={24} color="rgba(255,255,255,0.8)" />
                <Text style={styles.videoTileTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            {item.likes_count !== undefined && (
                <View style={styles.videoTileLikes}>
                    <Ionicons name="heart" size={10} color="white" />
                    <Text style={styles.videoTileLikesText}>{item.likes_count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Entdecken</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#888" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rezepte oder Köche suchen..."
                        placeholderTextColor="#666"
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={() => handleSearch()}
                        returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchText(''); setHasSearched(false); setSearchResults({ users: [], videos: [] }); }}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {isSearching ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                    <Text style={styles.searchingText}>Suche...</Text>
                </View>
            ) : !hasSearched ? (
                /* Trending Tags */
                <View style={styles.trendingContainer}>
                    <Text style={styles.trendingTitle}>🔥 Trending</Text>
                    <View style={styles.tagsWrap}>
                        {TRENDING_TAGS.map((tag, i) => (
                            <TouchableOpacity key={i} style={styles.tagChip} onPress={() => handleTagPress(tag)} activeOpacity={0.7}>
                                <Text style={styles.tagChipText}>#{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ) : (
                <FlatList
                    data={[]}
                    renderItem={null}
                    ListHeaderComponent={
                        <View>
                            {/* Users */}
                            {searchResults.users.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Köche</Text>
                                    {searchResults.users.map((user, i) => (
                                        <View key={user.id || i}>{renderUserItem({ item: user })}</View>
                                    ))}
                                </View>
                            )}

                            {/* Videos */}
                            {searchResults.videos.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Rezepte</Text>
                                    <View style={styles.videoGrid}>
                                        {searchResults.videos.map((video, i) => (
                                            <View key={video.id || i}>{renderVideoTile({ item: video })}</View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* No results */}
                            {searchResults.users.length === 0 && searchResults.videos.length === 0 && (
                                <View style={styles.noResults}>
                                    <Ionicons name="search-outline" size={60} color="#333" />
                                    <Text style={styles.noResultsTitle}>Keine Ergebnisse</Text>
                                    <Text style={styles.noResultsSubtitle}>Kein Treffer für „{searchText}"</Text>
                                </View>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 10 },
    headerTitle: { color: 'white', fontSize: 28, fontWeight: '800' },

    searchBarContainer: { paddingHorizontal: 16, paddingBottom: 12 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1a1a1a', borderRadius: 14,
        paddingHorizontal: 14, height: 46,
    },
    searchInput: { flex: 1, color: 'white', fontSize: 16, marginLeft: 10 },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchingText: { color: '#666', marginTop: 12, fontSize: 14 },

    trendingContainer: { padding: 20 },
    trendingTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 16 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tagChip: {
        backgroundColor: '#1a1a1a', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 10,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    tagChipText: { color: THEME_COLOR, fontSize: 14, fontWeight: '600' },

    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { color: '#888', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

    userItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a',
    },
    userAvatar: { width: 48, height: 48, borderRadius: 24 },
    userAvatarPlaceholder: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#222', justifyContent: 'center', alignItems: 'center',
    },
    userAvatarLetter: { color: THEME_COLOR, fontSize: 20, fontWeight: '700' },
    userInfo: { flex: 1, marginLeft: 14 },
    userDisplayName: { color: 'white', fontSize: 16, fontWeight: '600' },
    userUsername: { color: '#666', fontSize: 13, marginTop: 2 },

    videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
    videoTile: {
        width: TILE_SIZE, height: TILE_SIZE * 1.3,
        backgroundColor: '#1a1a1a', borderRadius: 8, overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
    },
    videoTileInner: { justifyContent: 'center', alignItems: 'center', padding: 8 },
    videoTileTitle: { color: '#ccc', fontSize: 11, textAlign: 'center', marginTop: 6 },
    videoTileLikes: {
        position: 'absolute', bottom: 6, left: 6,
        flexDirection: 'row', alignItems: 'center', gap: 3,
    },
    videoTileLikesText: { color: 'white', fontSize: 10 },

    noResults: { alignItems: 'center', paddingTop: 60 },
    noResultsTitle: { color: '#555', fontSize: 20, fontWeight: '600', marginTop: 16 },
    noResultsSubtitle: { color: '#444', fontSize: 14, marginTop: 6 },
});

export default SearchScreen;
