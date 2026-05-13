import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Image, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useGlobal } from '../context/GlobalContext';

const { width } = Dimensions.get('window');

const CookingModeModal = ({ visible, onClose, selectedRecipe }) => {
    useKeepAwake(); // Verhindert, dass der Bildschirm ausgeht
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    if (!selectedRecipe) return null;

    // Wir bauen die "Seiten" (Pages) für den Kochmodus zusammen:
    // Seite 0: Vorbereitung (Zutaten)
    // Seite 1..N: Die einzelnen Schritte
    const pages = [
        { type: 'prep', title: 'Vorbereitung', data: selectedRecipe.ingredients || [] },
        ...(selectedRecipe.steps || []).map((step, index) => ({
            type: 'step',
            title: `Schritt ${index + 1} von ${selectedRecipe.steps?.length || 0}`,
            data: step
        }))
    ];

    const goToNext = () => {
        if (currentIndex < pages.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
        }
    };

    const handleMomentumScrollEnd = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const renderPage = ({ item }) => {
        if (item.type === 'prep') {
            return (
                <View style={styles.pageContainer}>
                    <Text style={styles.pageTitle}>{item.title}</Text>
                    <FlatList
                        data={item.data}
                        keyExtractor={(ing, idx) => idx.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        renderItem={({ item: ing }) => (
                            <View style={styles.ingredientRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ingredientText}>{ing.name}</Text>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>Keine Zutaten angegeben.</Text>}
                    />
                </View>
            );
        }

        if (item.type === 'step') {
            return (
                <View style={styles.pageContainer}>
                    <Text style={styles.pageTitle}>{item.title}</Text>
                    <View style={styles.stepContentBox}>
                        <Text style={styles.stepText}>{item.data.instruction}</Text>
                    </View>
                    
                    {/* Placeholder für zukünftige Sprachsteuerung */}
                    <View style={styles.voicePlaceholder}>
                        <Ionicons name="mic-outline" size={30} color="#666" />
                        <Text style={styles.voicePlaceholderText}>Sprachsteuerung folgt...</Text>
                    </View>
                </View>
            );
        }
        return null;
    };

    return (
        <Modal visible={visible} animationType="fade" presentationStyle="overFullScreen" onRequestClose={onClose}>
            <View style={styles.container}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header: Thumbnail & Close Button */}
                    <View style={styles.header}>
                        {selectedRecipe.video_thumbnail || selectedRecipe.video_url ? (
                            <Image 
                                source={{ uri: selectedRecipe.video_thumbnail || selectedRecipe.video_url }} 
                                style={styles.thumbnail} 
                                resizeMode="cover" 
                            />
                        ) : (
                            <View style={[styles.thumbnail, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="restaurant" size={40} color="#555" />
                            </View>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={32} color="white" />
                        </TouchableOpacity>
                        
                        {/* Semi-transparent overlay to make text readable if needed, or just standard UI */}
                        <View style={styles.headerOverlay}>
                            <Text style={styles.headerRecipeTitle} numberOfLines={1}>{selectedRecipe.title}</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / pages.length) * 100}%` }]} />
                    </View>

                    {/* Content: Swipeable Pages */}
                    <View style={styles.content}>
                        <FlatList
                            ref={flatListRef}
                            data={pages}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={renderPage}
                            onMomentumScrollEnd={handleMomentumScrollEnd}
                        />
                    </View>

                    {/* Footer Controls */}
                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.navBtn, { opacity: currentIndex === 0 ? 0.3 : 1 }]} 
                            onPress={goToPrev}
                            disabled={currentIndex === 0}
                        >
                            <Ionicons name="arrow-back" size={40} color="white" />
                        </TouchableOpacity>

                        <Text style={styles.pageIndicator}>
                            {currentIndex + 1} / {pages.length}
                        </Text>

                        <TouchableOpacity 
                            style={[styles.navBtn, { backgroundColor: themeColor, opacity: currentIndex === pages.length - 1 ? 0.3 : 1 }]} 
                            onPress={goToNext}
                            disabled={currentIndex === pages.length - 1}
                        >
                            <Ionicons name="arrow-forward" size={40} color="white" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: { height: 150, width: '100%', position: 'relative' },
    thumbnail: { width: '100%', height: '100%', opacity: 0.7 },
    headerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: 'rgba(0,0,0,0.5)' },
    headerRecipeTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 25, padding: 8, zIndex: 10 },
    
    progressBarContainer: { height: 6, width: '100%', backgroundColor: '#333' },
    progressBarFill: { height: '100%', backgroundColor: themeColor },

    content: { flex: 1 },
    pageContainer: { width, padding: 20, flex: 1 },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 30, textAlign: 'center' },
    
    // Ingredients specific
    ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12 },
    bullet: { width: 12, height: 12, borderRadius: 6, backgroundColor: themeColor, marginRight: 15 },
    ingredientText: { fontSize: 22, color: '#e0e0e0', flex: 1 },
    emptyText: { color: '#888', fontSize: 18, textAlign: 'center', marginTop: 20 },

    // Step specific
    stepContentBox: { backgroundColor: '#1e1e1e', padding: 25, borderRadius: 16, minHeight: 200, justifyContent: 'center' },
    stepText: { fontSize: 26, color: '#ffffff', lineHeight: 36, textAlign: 'center' },

    voicePlaceholder: { marginTop: 40, alignItems: 'center', opacity: 0.5 },
    voicePlaceholderText: { color: '#666', marginTop: 10, fontSize: 16 },

    // Footer
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#333' },
    navBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
    pageIndicator: { fontSize: 20, color: '#888', fontWeight: 'bold' }
});

export default CookingModeModal;
