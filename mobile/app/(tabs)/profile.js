import React, { useState } from 'react';
import ProfileScreen from '../../screens/ProfileScreen';
import { useGlobal } from '../../context/GlobalContext';
import RecipeModal from '../../components/RecipeModal';

export default function ProfileTab() {
    const {
        userToken, myProfileData, myVideos, likedVideos, savedVideos,
        collections, collectionVideos, loadLikedVideos, loadSavedVideosAll,
        fetchCollections, loadCollectionVideos, activeCollectionId, setActiveCollectionId,
        loadMyProfile, logout, deleteRecipeGlobal
    } = useGlobal();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const deleteRecipe = async () => {
        if (!selectedRecipe) return;
        const success = await deleteRecipeGlobal(selectedRecipe.id);
        if (success) {
            setModalVisible(false);
            setSelectedRecipe(null);
        }
    };

    return (
        <>
            <ProfileScreen
                userToken={userToken}
                myProfileData={myProfileData}
                myVideos={myVideos}
                likedVideos={likedVideos}
                savedVideos={savedVideos}
                collections={collections}
                collectionVideos={collectionVideos}
                loadLikedVideos={loadLikedVideos}
                loadSavedVideosAll={loadSavedVideosAll}
                fetchCollections={fetchCollections}
                loadCollectionVideos={loadCollectionVideos}
                activeCollectionId={activeCollectionId}
                setActiveCollectionId={setActiveCollectionId}
                setSelectedRecipe={setSelectedRecipe}
                setModalVisible={setModalVisible}
                loadMyProfile={loadMyProfile}
                onLogout={logout}
            />

            <RecipeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                selectedRecipe={selectedRecipe}
                deleteRecipe={deleteRecipe}
                userToken={userToken}
            />
        </>
    );
}
