import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, TextInput,
    FlatList, Image, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL,  getFullUrl } from '../constants/Config';
import { useGlobal } from '../context/GlobalContext';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_COLS = 2; // Change to 2 column layout
const TILE_SIZE = (width - (32 + GRID_GAP)) / GRID_COLS; // 32 is padding (16*2)

const TRENDING_TAGS = ['Für dich', 'Pasta', 'Vegan', 'Dessert', 'Schnell', 'Asiatisch', 'Salat', 'Deutsch', 'Backen'];

const SearchScreen = ({ userToken, navigation, onChefPress }) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState({ users: [], videos: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [trendingVideos, setTrendingVideos] = useState([]);
    const [isLoadingTrending, setIsLoadingTrending] = useState(true);

    React.useEffect(() => {
        const fetchTrending = async () => {
            try {
                const r = await fetch(`${BASE_URL}/recipes/trending`, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                const d = await r.json();
                setTrendingVideos(Array.isArray(d.data) ? d.data : []);
            } catch (e) {
                console.log(e);
            } finally {
                setIsLoadingTrending(false);
            }
        };
        if (userToken) fetchTrending();
    }, [userToken]);

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
        if (navigation?.navigate) {
            // Using Expo router via the passed navigation prop
            navigation.navigate(`tag/${tag}`);
        } else {
            console.warn("Navigation prop missing");
        }
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

    const renderVideoTile = ({ item }) => {
        const formatViews = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num || 0;
        };
        return (
            <TouchableOpacity style={styles.videoTile} activeOpacity={0.8}>
                <View style={styles.videoTileInner}>
                    <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" style={{ position: 'absolute', top: 10, right: 10 }} />
                    <Text style={styles.videoTileTitle} numberOfLines={2}>{item.title}</Text>
                </View>
                <View style={styles.videoTileLikes}>
                    <Ionicons name="play" size={14} color="white" />
                    <Text style={styles.videoTileLikesText}>{formatViews(item.views || item.likes_count || 0)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

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
                    <ActivityIndicator size="large" color={themeColor} />
                    <Text style={styles.searchingText}>Suche...</Text>
                </View>
            ) : !hasSearched ? (
                /* Trending Tags & Grid */
                <View style={styles.trendingContainer}>
                    {/* Categories */}
                    <View style={styles.tagsScrollWrapper}>
                        <FlatList
                            data={TRENDING_TAGS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(tag) => tag}
                            contentContainerStyle={styles.tagsWrap}
                            renderItem={({ item, index }) => {
                                const isActive = index === 0;
                                return (
                                    <TouchableOpacity 
                                        style={[styles.tagChip, isActive && styles.tagChipActive]} 
                                        onPress={() => item !== 'Für dich' && handleTagPress(item)} 
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.tagChipText, isActive && styles.tagChipTextActive]}>{item}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                    
                    <Text style={styles.trendingTitle}>Trending in Deutschland</Text>
                    {isLoadingTrending ? (
                        <ActivityIndicator size="small" color={themeColor} style={{ marginTop: 20 }} />
                    ) : (
                        <View style={styles.videoGrid}>
                            {trendingVideos.length > 0 ? (
                                trendingVideos.map((video, i) => (
                                    <View key={video.id || i}>{renderVideoTile({ item: video })}</View>
                                ))
                            ) : (
                                <Text style={{ color: '#666', paddingHorizontal: 16 }}>Keine Trending-Rezepte gefunden.</Text>
                            )}
                        </View>
                    )}
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

const getStyles = (themeColor) => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 10 },
    headerTitle: { color: 'white', fontSize: 28, fontWeight: '800' },

    searchBarContainer: { paddingHorizontal: 16, paddingBottom: 12 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(102, 10, 194, 0.1)', borderRadius: 12, // bg-primary/10
        paddingHorizontal: 16, height: 48,
    },
    searchInput: { flex: 1, color: 'white', fontSize: 16, marginLeft: 10 },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchingText: { color: '#666', marginTop: 12, fontSize: 14 },

    trendingContainer: { flex: 1 },
    tagsScrollWrapper: { marginBottom: 24, marginTop: 8 },
    tagsWrap: { paddingHorizontal: 16, gap: 10 },
    tagChip: {
        backgroundColor: 'rgba(102, 10, 194, 0.1)', borderRadius: 20, // bg-primary/10
        paddingHorizontal: 18, paddingVertical: 10,
    },
    tagChipActive: { backgroundColor: themeColor },
    tagChipText: { color: themeColor, fontSize: 14, fontWeight: '600' },
    tagChipTextActive: { color: 'white' },
    trendingTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 16 },

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
    userAvatarLetter: { color: themeColor, fontSize: 20, fontWeight: '700' },
    userInfo: { flex: 1, marginLeft: 14 },
    userDisplayName: { color: 'white', fontSize: 16, fontWeight: '600' },
    userUsername: { color: '#666', fontSize: 13, marginTop: 2 },

    videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, paddingHorizontal: 16 },
    videoTile: {
        width: TILE_SIZE, height: TILE_SIZE * 1.33, // 3:4 aspect ratio
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

    noResults: { alignItems: 'center', paddingTop: 60 },
    noResultsTitle: { color: '#555', fontSize: 20, fontWeight: '600', marginTop: 16 },
    noResultsSubtitle: { color: '#444', fontSize: 14, marginTop: 6 },
});

export default SearchScreen;
