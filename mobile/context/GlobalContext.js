import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, getFullUrl } from '../constants/Config';

const GlobalContext = createContext();

export const useGlobal = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Global Feed Data
    const [videos, setVideos] = useState([]);

    // Profile Data
    const [myProfileData, setMyProfileData] = useState(null);
    const [myVideos, setMyVideos] = useState([]);
    const [likedVideos, setLikedVideos] = useState([]);
    const [savedVideos, setSavedVideos] = useState([]);

    // Collections
    const [collections, setCollections] = useState([]);
    const [activeCollectionId, setActiveCollectionId] = useState(null);
    const [collectionVideos, setCollectionVideos] = useState([]);

    useEffect(() => {
        checkLogin();
    }, []);

    useEffect(() => {
        if (userToken) {
            loadFeed();
            loadMyProfile();
            loadCollections();
        }
    }, [userToken]);

    const checkLogin = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                setUserToken(token);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (token) => {
        await AsyncStorage.setItem('userToken', token);
        setUserToken(token);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        setUserToken(null);
        setMyProfileData(null);
        setVideos([]);
        setMyVideos([]);
        setLikedVideos([]);
        setSavedVideos([]);
    };

    const loadFeed = async () => {
        if (!userToken) return;
        try {
            const r = await fetch(`${BASE_URL}/feed`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            if (Array.isArray(d)) {
                setVideos(d.map(v => ({
                    ...v,
                    video_url: getFullUrl(v.video_url),
                    likes: v.likes_count || 0,
                    is_liked: v.i_liked_it,
                    saved: v.i_saved_it,
                    i_follow: v.i_follow_owner
                })));
            } else {
                setVideos([]);
            }
        } catch (e) {
            console.log("Feed Error", e);
            setVideos([]);
        }
    };

    const loadMyProfile = async () => {
        if (!userToken) return;
        try {
            const [p, v, l, s] = await Promise.all([
                fetch(`${BASE_URL}/my-profile`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()),
                fetch(`${BASE_URL}/my-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()),
                fetch(`${BASE_URL}/liked-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json()),
                fetch(`${BASE_URL}/saved-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } }).then(r => r.json())
            ]);
            setMyProfileData(p);
            setMyVideos(Array.isArray(v) ? v.map(x => ({ ...x, video_url: getFullUrl(x.video_url), likes: x.likes_count || 0 })) : []);
            setLikedVideos(Array.isArray(l) ? l.map(x => ({ ...x, video_url: getFullUrl(x.video_url), likes: x.likes_count || 0 })) : []);
            setSavedVideos(Array.isArray(s) ? s.map(x => ({ ...x, video_url: getFullUrl(x.video_url), likes: x.likes_count || 0 })) : []);
        } catch (e) {
            console.log("Profile Sync Error", e);
        }
    };

    const loadCollections = async () => {
        if (!userToken) return;
        try {
            const r = await fetch(`${BASE_URL}/collections`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            if (Array.isArray(d)) setCollections(d);
            else setCollections([]);
        } catch (e) {
            setCollections([]);
        }
    };

    const loadLikedVideos = async () => {
        if (!userToken) return;
        try {
            const r = await fetch(`${BASE_URL}/liked-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const l = await r.json();
            setLikedVideos(Array.isArray(l) ? l.map(x => ({ ...x, video_url: getFullUrl(x.video_url) })) : []);
        } catch (e) { console.log(e); }
    };

    const loadSavedVideosAll = async () => {
        if (!userToken) return;
        try {
            const r = await fetch(`${BASE_URL}/saved-videos`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const s = await r.json();
            setSavedVideos(Array.isArray(s) ? s.map(x => ({ ...x, video_url: getFullUrl(x.video_url) })) : []);
        } catch (e) { console.log(e); }
    };

    const loadCollectionVideos = async (id) => {
        if (!userToken) return;
        try {
            const r = await fetch(`${BASE_URL}/collections/${id}/videos`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const d = await r.json();
            setCollectionVideos(Array.isArray(d) ? d.map(x => ({ ...x, video_url: getFullUrl(x.video_url) })) : []);
            setActiveCollectionId(id);
        } catch (e) { }
    };

    const toggleLike = async (id) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, is_liked: !v.is_liked, likes: v.is_liked ? (v.likes - 1) : (v.likes + 1) } : v));
        try {
            await fetch(`${BASE_URL}/recipes/${id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` } });
            loadMyProfile();
        } catch (e) { }
    };

    const toggleFollow = async (userId, userProfileData, setUserProfileData) => {
        if (!userId) return;
        setVideos(prev => prev.map(v => v.owner_id === userId ? { ...v, i_follow: !v.i_follow } : v));
        if (userProfileData && userProfileData.id === userId && setUserProfileData) {
            setUserProfileData(prev => ({ ...prev, i_follow: !prev.i_follow, followers_count: prev.i_follow ? prev.followers_count - 1 : prev.followers_count + 1 }));
        }
        try {
            await fetch(`${BASE_URL}/users/${userId}/toggle-follow`, { method: 'POST', headers: { 'Authorization': `Bearer ${userToken}` } });
            loadMyProfile();
        } catch (e) { console.log(e); }
    };

    // Deleting
    const deleteRecipeGlobal = async (recipeId) => {
        try {
            await fetch(`${BASE_URL}/recipes/${recipeId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${userToken}` } });
            loadFeed();
            loadMyProfile();
            return true;
        } catch (e) {
            return false;
        }
    }

    const value = {
        userToken, isLoading, handleLogin, logout,
        videos, setVideos, loadFeed,
        myProfileData, setMyProfileData, myVideos, setMyVideos,
        likedVideos, loadLikedVideos,
        savedVideos, loadSavedVideosAll,
        collections, setCollections, fetchCollections: loadCollections,
        activeCollectionId, setActiveCollectionId,
        collectionVideos, setCollectionVideos, loadCollectionVideos,
        toggleLike, toggleFollow, deleteRecipeGlobal, loadMyProfile
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
