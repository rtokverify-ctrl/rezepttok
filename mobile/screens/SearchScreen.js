import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getFullUrl } from '../constants/Config';

const SearchScreen = ({ userToken, navigation }) => {
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState({ users: [], videos: [] });
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchText.trim()) return;
        setIsSearching(true);
        try {
            const r = await fetch(`${BASE_URL}/search?q=${searchText}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            setSearchResults({
                users: d.users.map(u => ({ ...u, avatar_url: u.avatar_url ? getFullUrl(u.avatar_url) : null })),
                videos: d.videos.map(v => ({ ...v, video_url: `${BASE_URL}/static/${v.video_url.split('/').pop()}` }))
            });
        } catch (e) {
            console.log(e);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'black', paddingTop: 40 }}>
            <View style={{ padding: 20 }}>
                <Text style={styles.headerTitle}>Suche 🔍</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 15 }}>
                    <Ionicons name="search" size={20} color="#888" />
                    <TextInput
                        style={{ flex: 1, color: 'white', padding: 15, fontSize: 16 }}
                        placeholder="Rezepte oder Nutzer..."
                        placeholderTextColor="#888"
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>
            </View>
            {/* TODO: Add logic to display results if needed here, or pass valid rendering logic */}
        </View>
    );
};

const styles = StyleSheet.create({
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});

export default SearchScreen;
