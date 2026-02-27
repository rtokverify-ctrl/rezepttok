import React, { useState } from 'react';
import FeedScreen from '../../screens/FeedScreen';
import { useGlobal } from '../../context/GlobalContext';
import RecipeModal from '../../components/RecipeModal';
import CommentsModal from '../../components/CommentsModal';
import SaveModal from '../../components/SaveModal';
import UserProfileModal from '../../components/UserProfileModal';
import { BASE_URL, getFullUrl } from '../../constants/Config';
import { useRouter } from 'expo-router';

export default function FeedTab() {
    const {
        userToken, videos, toggleLike, setVideos, loadMyProfile,
        collections, loadCollections
    } = useGlobal();

    const router = useRouter();

    // Local Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const [commentsVisible, setCommentsVisible] = useState(false);
    const [currentComments, setCurrentComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentVideoId, setCommentVideoId] = useState(null);

    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [recipeToSave, setRecipeToSave] = useState(null);
    const [currentRecipeCollections, setCurrentRecipeCollections] = useState([]);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    const [userProfileVisible, setUserProfileVisible] = useState(false);
    const [userProfileData, setUserProfileData] = useState(null);
    const [userProfileVideos, setUserProfileVideos] = useState([]);

    // --- Actions ---
    const { deleteRecipeGlobal, toggleFollow: globalToggleFollow, myProfileData } = useGlobal();

    const deleteRecipe = async () => {
        if (!selectedRecipe) return;
        const success = await deleteRecipeGlobal(selectedRecipe.id);
        if (success) {
            setModalVisible(false);
            setSelectedRecipe(null);
        }
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
        setVideos(prev => prev.map(v => v.id === recipeToSave.id ? { ...v, saved: !v.saved } : v));
        setSaveModalVisible(false);
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
            if (loadCollections) loadCollections(); // refresh context collections
            setNewCollectionName('');
            setIsCreatingCollection(false);
            if (d.id) {
                await toggleCollectionForRecipe(d.id);
            }
        } catch (e) { }
    };

    const toggleCollectionForRecipe = async (collectionId) => {
        if (!collectionId || !recipeToSave) return;
        const isAdded = currentRecipeCollections.includes(collectionId);
        const newCollections = isAdded ? currentRecipeCollections.filter(id => id !== collectionId) : [...currentRecipeCollections, collectionId];
        setCurrentRecipeCollections(newCollections);

        try {
            await fetch(`${BASE_URL}/recipes/${recipeToSave.id}/toggle-collection/${collectionId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` } });
            const isSavedAnywhere = newCollections.length > 0;
            setVideos(prev => prev.map(v => v.id === recipeToSave.id ? { ...v, saved: isSavedAnywhere } : v));
            loadMyProfile();
        } catch (e) { }
    };

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

    const handleChefPress = async (chefId) => {
        if (!chefId) return;
        if (myProfileData && chefId === myProfileData.id) {
            router.push('/(tabs)/profile');
        } else {
            try {
                const r = await fetch(`${BASE_URL}/users/${chefId}/profile`, { headers: { 'Authorization': `Bearer ${userToken}` } });
                const d = await r.json();
                if (d.profile) {
                    setUserProfileData(d.profile);
                    setUserProfileVideos(Array.isArray(d.videos) ? d.videos.map(v => ({ ...v, video_url: getFullUrl(v.video_url) })) : []);
                    setUserProfileVisible(true);
                }
            } catch (e) { console.log(e); }
        }
    };

    const toggleFollowInFeed = (userId) => {
        globalToggleFollow(userId, userProfileData, setUserProfileData);
    };

    return (
        <>
            <FeedScreen
                videos={videos}
                toggleLike={toggleLike}
                handleGlobalSave={handleGlobalSave}
                setSelectedRecipe={setSelectedRecipe}
                setModalVisible={setModalVisible}
                onOpenComments={onOpenComments}
                onChefPress={handleChefPress}
                toggleFollowInFeed={toggleFollowInFeed}
                setCurrentScreen={(target) => router.push(`/(tabs)/${target}`)}
            />

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
                toggleFollowOnProfile={() => toggleFollowInFeed(userProfileData?.id)}
                setSelectedRecipe={setSelectedRecipe}
                setModalVisible={setModalVisible}
            />
        </>
    );
}
