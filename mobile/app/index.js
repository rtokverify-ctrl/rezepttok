import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, TouchableOpacity, StyleSheet, Modal, Text, Animated, Dimensions, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Inter_700Bold } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL, THEME_COLOR, NAVBAR_HEIGHT } from '../constants/Config';

// Screens
import AuthScreen from '../screens/AuthScreen';
import SetupScreen from '../screens/SetupScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import UploadScreen from '../screens/UploadScreen';
import CookingScreen from '../screens/CookingScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Components & Modals
import SaveModal from '../components/SaveModal';
import UserProfileModal from '../components/UserProfileModal';
import RecipeModal from '../components/RecipeModal';
import CommentsModal from '../components/CommentsModal';

export default function App() {
    // --- STATE ---
    const [fontsLoaded] = useFonts({ 'Inter-Bold': Inter_700Bold });
    const [userToken, setUserToken] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('auth'); // auth, setup, feed, search, upload, cooking, notifications, profile

    // Data
    const [videos, setVideos] = useState([]);
    const [myProfileData, setMyProfileData] = useState(null);
    const [myVideos, setMyVideos] = useState([]);
    const [likedVideos, setLikedVideos] = useState([]);
    const [savedVideos, setSavedVideos] = useState([]);

    // Collections
    const [collections, setCollections] = useState([]);
    const [activeCollectionId, setActiveCollectionId] = useState(null);
    const [collectionVideos, setCollectionVideos] = useState([]);

    // Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const [commentsVisible, setCommentsVisible] = useState(false);
    const [currentComments, setCurrentComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentVideoId, setCommentVideoId] = useState(null);

    const [userProfileVisible, setUserProfileVisible] = useState(false);
    const [userProfileData, setUserProfileData] = useState(null);
    const [userProfileVideos, setUserProfileVideos] = useState([]);

    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [recipeToSave, setRecipeToSave] = useState(null);
    const [currentRecipeCollections, setCurrentRecipeCollections] = useState([]);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    // --- EFFECTS ---
    useEffect(() => { checkLogin(); }, []);
    useEffect(() => { if (userToken) { loadFeed(); loadMyProfile(); loadCollections(); } }, [userToken]);

    // --- AUTH & DATA LOADING ---
    const checkLogin = async () => {
        const t = await AsyncStorage.getItem('userToken');
        if (t) { setUserToken(t); setCurrentScreen('feed'); }
    };

    const handleLogin = (token, isNewUser) => {
        setUserToken(token);
        setCurrentScreen(isNewUser ? 'setup' : 'feed');
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        setUserToken(null);
        setCurrentScreen('auth');
        setMyProfileData(null);
    };

    const getFullVideoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}/static/${url.split('/').pop()}`;
    };

    const loadFeed = async () => {
        try {
            const r = await fetch(`${BASE_URL}/feed`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            if (Array.isArray(d)) {
                setVideos(d.map(v => ({
                    ...v,
                    video_url: getFullVideoUrl(v.video_url),
                    likes: v.likes_count || 0,
                    is_liked: v.i_liked_it,
                    saved: v.i_saved_it,
                    i_follow: v.i_follow_owner
                })));
            } else {
                setVideos([]);
            }
        } catch (e) { console.log(e); setVideos([]); }
    };

    const loadMyProfile = async () => {
        try {
            const [p, v, l, s] = await Promise.all([
                fetch(`${BASE_URL}/my-profile`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()),
                fetch(`${BASE_URL}/my-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()),
                fetch(`${BASE_URL}/liked-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()),
                fetch(`${BASE_URL}/saved-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json())
            ]);
            setMyProfileData(p);
            // Map likes/saved correctly for local views too
            setMyVideos(Array.isArray(v) ? v.map(x => ({ ...x, video_url: getFullVideoUrl(x.video_url), likes: x.likes_count || 0 })) : []);
            setLikedVideos(Array.isArray(l) ? l.map(x => ({ ...x, video_url: getFullVideoUrl(x.video_url), likes: x.likes_count || 0 })) : []);
            setSavedVideos(Array.isArray(s) ? s.map(x => ({ ...x, video_url: getFullVideoUrl(x.video_url), likes: x.likes_count || 0 })) : []);
        } catch (e) { console.log(e); }
    };

    // --- ACTIONS ---
    const toggleLike = async (id) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, is_liked: !v.is_liked, likes: v.is_liked ? (v.likes - 1) : (v.likes + 1) } : v));
        try { await fetch(`${BASE_URL}/recipes/${id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` } }); loadMyProfile(); } catch (e) { }
    };

    // ... (toggleFollow, handleChefPress, deleteRecipe, openCommentsModal, sendComment remain same) ...

    // --- COMMENTS ---
    const onOpenComments = async (videoId) => {
        if (!videoId) return;
        setCommentVideoId(videoId);
        setCommentsVisible(true);
        setCommentLoading(true);
        try {
            const r = await fetch(`${BASE_URL}/recipes/${videoId}/comments`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            setCurrentComments(await r.json());
        } catch (e) { } finally { setCommentLoading(false); }
    };

    const sendComment = async () => {
        if (!newComment.trim() || !commentVideoId) return;
        try {
            const r = await fetch(`${BASE_URL}/recipes/${commentVideoId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ text: newComment }) });
            const d = await r.json();
            setCurrentComments([d, ...currentComments]);
            setNewComment('');
        } catch (e) { }
    };

    // --- COLLECTIONS / SAVE ---
    const loadCollections = async () => {
        try {
            const r = await fetch(`${BASE_URL}/collections`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            if (Array.isArray(d)) setCollections(d);
            else setCollections([]);
        } catch (e) { setCollections([]); }
    };

    const handleGlobalSave = async (recipe) => {
        if (!recipe || !recipe.id) return;
        setRecipeToSave(recipe);
        try {
            const r = await fetch(`${BASE_URL}/recipes/${recipe.id}/save-status`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            setCurrentRecipeCollections(Array.isArray(d) ? d : []);
            setSaveModalVisible(true);
        } catch (e) { setCurrentRecipeCollections([]); }
    };

    const performGlobalSave = async () => {
        if (!recipeToSave) return;
        // Optimistic update
        setVideos(prev => prev.map(v => v.id === recipeToSave.id ? { ...v, saved: !v.saved } : v));
        setSaveModalVisible(false); // Close modal on quick save? Or keep open? User said "simply save". Closing is better UX for "Quick Save".

        try {
            await fetch(`${BASE_URL}/recipes/${recipeToSave.id}/toggle-global-save`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` } });
            loadMyProfile();
        } catch (e) { }
    };

    const createCollection = async () => {
        if (!newCollectionName.trim()) return;
        try {
            const r = await fetch(`${BASE_URL}/collections`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ name: newCollectionName }) });
            const d = await r.json();
            const newCols = [...collections, d];
            setCollections(newCols);
            setNewCollectionName('');
            setIsCreatingCollection(false);

            // Immediately add to new collection
            if (d.id) {
                await toggleCollectionForRecipe(d.id);
            }
        } catch (e) { }
    };

    const toggleCollectionForRecipe = async (collectionId) => {
        if (!collectionId || !recipeToSave) return;
        const isAdded = currentRecipeCollections.includes(collectionId);

        // Optimistic update of local state for Modal
        const newCollections = isAdded ? currentRecipeCollections.filter(id => id !== collectionId) : [...currentRecipeCollections, collectionId];
        setCurrentRecipeCollections(newCollections);

        try {
            await fetch(`${BASE_URL}/recipes/${recipeToSave.id}/toggle-collection/${collectionId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` } });
            // Also update global saved status if we added to a collection, it is implicitly saved
            if (!isAdded) {
                setVideos(prev => prev.map(v => v.id === recipeToSave.id ? { ...v, saved: true } : v));
            }
            loadMyProfile();
        } catch (e) { }
    };

    const loadCollectionVideos = async (id) => {
        try {
            const r = await fetch(`${BASE_URL}/collections/${id}/videos`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            setCollectionVideos(Array.isArray(d) ? d.map(x => ({ ...x, video_url: getFullVideoUrl(x.video_url) })) : []);
            setActiveCollectionId(id);
        } catch (e) { }
    };

    // --- RENDER ---
    if (!fontsLoaded) return null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="black" translucent={true} />

            <View style={{ flex: 1 }}>
                {currentScreen === 'auth' && <AuthScreen onLoginSuccess={handleLogin} />}
                {currentScreen === 'setup' && <SetupScreen userToken={userToken} initialDisplayName={myProfileData?.username} onSetupComplete={() => setCurrentScreen('feed')} />}
                {currentScreen === 'feed' && (
                    <FeedScreen
                        videos={videos}
                        toggleLike={toggleLike}
                        handleGlobalSave={handleGlobalSave}
                        setSelectedRecipe={setSelectedRecipe}
                        setModalVisible={setModalVisible}
                        onOpenComments={onOpenComments}
                        onChefPress={handleChefPress}
                        toggleFollowInFeed={toggleFollow}
                        currentScreen={currentScreen}
                        setCurrentScreen={setCurrentScreen}
                    />
                )}
                {currentScreen === 'search' && <SearchScreen userToken={userToken} navigation={{ navigate: setCurrentScreen }} />}
                {currentScreen === 'upload' && <UploadScreen userToken={userToken} onUploadComplete={() => { setCurrentScreen('feed'); loadFeed(); loadMyProfile(); }} />}
                {currentScreen === 'cooking' && <CookingScreen userToken={userToken} />}
                {currentScreen === 'notifications' && <NotificationScreen userToken={userToken} />}
                {currentScreen === 'profile' && (
                    <ProfileScreen
                        userToken={userToken}
                        myProfileData={myProfileData}
                        myVideos={myVideos}
                        likedVideos={likedVideos}
                        savedVideos={savedVideos}
                        collections={collections}
                        collectionVideos={collectionVideos}
                        loadLikedVideos={() => fetch(`${BASE_URL}/liked-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()).then(l => setLikedVideos(Array.isArray(l) ? l.map(x => ({ ...x, video_url: getFullVideoUrl(x.video_url) })) : []))}
                        loadSavedVideosAll={() => fetch(`${BASE_URL}/saved-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()).then(s => setSavedVideos(Array.isArray(s) ? s.map(x => ({ ...x, video_url: getFullVideoUrl(x.video_url) })) : []))}
                        fetchCollections={loadCollections}
                        loadCollectionVideos={loadCollectionVideos}
                        activeCollectionId={activeCollectionId}
                        setActiveCollectionId={setActiveCollectionId}
                        setSelectedRecipe={setSelectedRecipe}
                        setModalVisible={setModalVisible}
                        loadMyProfile={loadMyProfile}
                        onLogout={logout}
                    />
                )}
            </View>

            {currentScreen !== 'auth' && currentScreen !== 'setup' && (
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => setCurrentScreen('feed')}>
                        <Ionicons name="home" size={24} color={currentScreen === 'feed' ? 'white' : '#555'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCurrentScreen('cooking')}>
                        <MaterialCommunityIcons name="chef-hat" size={28} color={currentScreen === 'cooking' ? 'white' : '#555'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCurrentScreen('upload')} style={styles.plusButton}>
                        <LinearGradient colors={[THEME_COLOR, '#33CCFF']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="add" size={28} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCurrentScreen('notifications')}>
                        <Ionicons name="notifications" size={24} color={currentScreen === 'notifications' ? 'white' : '#555'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setCurrentScreen('profile'); loadMyProfile(); }}>
                        <Ionicons name="person" size={24} color={currentScreen === 'profile' ? 'white' : '#555'} />
                    </TouchableOpacity>
                </View>
            )}

            {/* GLOBAL MODALS */}
            <RecipeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                selectedRecipe={selectedRecipe}
                deleteRecipe={deleteRecipe}
                userToken={userToken}
            />

            <CommentsModal
                visible={commentsVisible}
                onClose={() => setCommentsVisible(false)}
                comments={currentComments}
                loading={commentLoading}
                newComment={newComment}
                setNewComment={setNewComment}
                sendComment={sendComment}
            />

            <SaveModal
                visible={saveModalVisible}
                onClose={() => setSaveModalVisible(false)}
                collections={collections}
                currentRecipeCollections={currentRecipeCollections}
                toggleCollectionForRecipe={toggleCollectionForRecipe}
                createCollection={createCollection}
                isCreatingCollection={isCreatingCollection}
                setIsCreatingCollection={setIsCreatingCollection}
                newCollectionName={newCollectionName}
                setNewCollectionName={setNewCollectionName}
                onGlobalSave={performGlobalSave}
            />

            <UserProfileModal
                visible={userProfileVisible}
                onClose={() => setUserProfileVisible(false)}
                userProfileData={userProfileData}
                userProfileVideos={userProfileVideos}
                toggleFollowOnProfile={() => toggleFollow(userProfileData.id)}
                setSelectedRecipe={setSelectedRecipe}
                setModalVisible={setModalVisible}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    navBar: { height: NAVBAR_HEIGHT, backgroundColor: 'black', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222' },
    plusButton: { width: 45, height: 30, borderRadius: 8, overflow: 'hidden' },
});