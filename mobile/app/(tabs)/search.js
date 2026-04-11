import React, { useState } from 'react';
import SearchScreen from '../../screens/SearchScreen';
import { useGlobal } from '../../context/GlobalContext';
import { useRouter } from 'expo-router';
import RecipeModal from '../../components/RecipeModal';
import UserProfileModal from '../../components/UserProfileModal';
import { BASE_URL, getFullUrl } from '../../constants/Config';

export default function SearchTab() {
    const { userToken, deleteRecipeGlobal, toggleFollow: globalToggleFollow, myProfileData } = useGlobal();
    const router = useRouter();

    // Recipe Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    // User Profile Modal
    const [userProfileVisible, setUserProfileVisible] = useState(false);
    const [userProfileData, setUserProfileData] = useState(null);
    const [userProfileVideos, setUserProfileVideos] = useState([]);

    const handleVideoPress = (video) => {
        setSelectedRecipe(video);
        setModalVisible(true);
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

    const deleteRecipe = async () => {
        if (!selectedRecipe) return;
        const success = await deleteRecipeGlobal(selectedRecipe.id);
        if (success) {
            setModalVisible(false);
            setSelectedRecipe(null);
        }
    };

    const toggleFollowOnSearch = (userId) => {
        globalToggleFollow(userId, userProfileData, setUserProfileData);
    };

    return (
        <>
            <SearchScreen
                userToken={userToken}
                navigation={{ navigate: (screen) => router.push(`/(tabs)/${screen}`) }}
                onChefPress={handleChefPress}
                onVideoPress={handleVideoPress}
            />

            <RecipeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                selectedRecipe={selectedRecipe}
                deleteRecipe={deleteRecipe}
                userToken={userToken}
            />

            <UserProfileModal
                visible={userProfileVisible}
                onClose={() => setUserProfileVisible(false)}
                userProfileData={userProfileData}
                userProfileVideos={userProfileVideos}
                toggleFollowOnProfile={() => toggleFollowOnSearch(userProfileData?.id)}
                setSelectedRecipe={(recipe) => { setUserProfileVisible(false); setSelectedRecipe(recipe); setModalVisible(true); }}
                setModalVisible={setModalVisible}
            />
        </>
    );
}
