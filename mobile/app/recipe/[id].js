import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Dimensions, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import VideoPost from '../../components/VideoPost';
import RecipeModal from '../../components/RecipeModal';
import { BASE_URL } from '../../constants/Config';
import { useGlobal } from '../../context/GlobalContext';

const { height } = Dimensions.get('window');

export default function SingleRecipeScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { userToken, themeColor } = useGlobal();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (id) {
            fetchRecipe();
        }
    }, [id]);

    const fetchRecipe = async () => {
        try {
            const headers = userToken ? { 'Authorization': 'Bearer ' + userToken } : {};
            const res = await fetch(`${BASE_URL}/recipes/${id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setRecipe(data);
            } else {
                Alert.alert("Fehler", "Rezept konnte nicht gefunden werden.");
                router.replace('/(tabs)/feed');
            }
        } catch (e) {
            console.log(e);
            Alert.alert("Fehler", "Netzwerkfehler beim Laden des Rezepts.");
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (recipeId) => {
        if (!userToken) return Alert.alert("Login", "Bitte logge dich ein.");
        setRecipe(prev => ({ 
            ...prev, 
            i_liked_it: !prev.i_liked_it, 
            likes_count: prev.i_liked_it ? prev.likes_count - 1 : prev.likes_count + 1 
        }));
        try {
            await fetch(`${BASE_URL}/recipes/${recipeId}/like`, { 
                method: 'POST', 
                headers: { 'Authorization': 'Bearer ' + userToken } 
            });
        } catch (e) {}
    };

    const handleSave = async (item) => {
        if (!userToken) return Alert.alert("Login", "Bitte logge dich ein.");
        setRecipe(prev => ({ ...prev, i_saved_it: !prev.i_saved_it }));
        try {
            await fetch(`${BASE_URL}/recipes/${item.id}/toggle-global-save`, { 
                method: 'POST', 
                headers: { 'Authorization': 'Bearer ' + userToken } 
            });
        } catch (e) {}
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={themeColor || "#00C2FF"} />
            </View>
        );
    }

    if (!recipe) {
        return null;
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <VideoPost
                item={recipe}
                isActive={true}
                toggleLike={toggleLike}
                onSavePress={handleSave}
                openModal={() => setModalVisible(true)}
                openComments={() => Alert.alert("Kommentare", "Gehe in den Feed, um Kommentare zu sehen.")}
                onChefPress={() => {}}
                onFollowPress={() => {}}
                containerHeight={height}
            />

            {/* Back Button */}
            <TouchableOpacity onPress={() => router.replace('/(tabs)/feed')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <RecipeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                selectedRecipe={recipe}
                deleteRecipe={() => {}}
                userToken={userToken}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50
    }
});
