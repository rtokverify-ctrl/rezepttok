import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL, THEME_COLOR } from '../constants/Config';

const { width, height } = Dimensions.get('window');

const RecipeModal = ({ visible, onClose, selectedRecipe, deleteRecipe, userToken }) => {
    const [addingToShop, setAddingToShop] = useState(false);

    const addToShoppingList = async () => {
        if (!selectedRecipe?.ingredients) return;
        setAddingToShop(true);
        try {
            // Add all ingredients
            const promises = selectedRecipe.ingredients.map(ing =>
                fetch(`${BASE_URL}/shopping-list`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
                    body: JSON.stringify({ item: ing.name })
                })
            );
            await Promise.all(promises);
            Alert.alert("Erfolg", "Zutaten wurden zur Einkaufsliste hinzugefügt! 🛒");
        } catch (e) {
            Alert.alert("Fehler", "Konnte Zutaten nicht hinzufügen.");
        } finally {
            setAddingToShop(false);
        }
    };

    if (!selectedRecipe) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Header Image */}
                    <View style={styles.imageContainer}>
                        {selectedRecipe.video_url ? (
                            <Image source={{ uri: selectedRecipe.video_thumbnail || selectedRecipe.video_url }} style={styles.image} resizeMode="cover" />
                        ) : (
                            <View style={[styles.image, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="restaurant" size={60} color="#555" />
                            </View>
                        )}
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />

                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>

                        <Text style={styles.title}>{selectedRecipe.title}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={16} color="#ddd" />
                                <Text style={styles.metaText}>{selectedRecipe.duration || '20'} min</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="people-outline" size={16} color="#ddd" />
                                <Text style={styles.metaText}>{selectedRecipe.servings || '2'} Port.</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="flame-outline" size={16} color="#ddd" />
                                <Text style={styles.metaText}>{selectedRecipe.calories || '450'} kcal</Text>
                            </View>
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Tags */}
                        {selectedRecipe.tags && (
                            <View style={styles.tagRow}>
                                {selectedRecipe.tags.map((t, i) => (
                                    <View key={i} style={styles.tag}>
                                        <Text style={styles.tagText}>#{t}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Tips */}
                        {selectedRecipe.tips && (
                            <View style={styles.tipBox}>
                                <Ionicons name="bulb" size={24} color="#F59E0B" style={{ marginRight: 10 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tipTitle}>Chef Tipp</Text>
                                    <Text style={styles.tipText}>{selectedRecipe.tips}</Text>
                                </View>
                            </View>
                        )}

                        {/* Ingredients */}
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Zutaten</Text>
                            <TouchableOpacity onPress={addToShoppingList} disabled={addingToShop} style={styles.addShopBtn}>
                                {addingToShop ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="cart-outline" size={20} color="white" />}
                                <Text style={styles.addShopText}>Alle hinzufügen</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.card}>
                            {selectedRecipe.ingredients?.map((ing, i) => (
                                <View key={i} style={styles.ingredientRow}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.ingredientText}>{ing.name}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Steps */}
                        <Text style={styles.sectionTitle}>Zubereitung</Text>
                        <View style={styles.stepsContainer}>
                            {selectedRecipe.steps?.map((s, i) => (
                                <View key={i} style={styles.stepRow}>
                                    <View style={styles.stepNumberBox}>
                                        <Text style={styles.stepNumber}>{s.order}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{s.instruction}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Delete Button (Owner) */}
                        {selectedRecipe.is_mine && (
                            <TouchableOpacity onPress={deleteRecipe} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
                                <Text style={styles.deleteText}>Rezept löschen</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    imageContainer: { width: '100%', height: 350, position: 'relative' },
    image: { width: '100%', height: '100%' },
    gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
    closeBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, zIndex: 10 },
    title: { position: 'absolute', bottom: 40, left: 20, right: 20, color: 'white', fontSize: 28, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
    metaRow: { position: 'absolute', bottom: 15, left: 20, flexDirection: 'row' },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    metaText: { color: '#ddd', marginLeft: 5, fontSize: 13, fontWeight: '600' },
    content: { padding: 20, marginTop: -20, backgroundColor: '#f8f9fa', borderTopLeftRadius: 25, borderTopRightRadius: 25 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    tag: { backgroundColor: '#e9ecef', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
    tagText: { color: '#495057', fontSize: 12, fontWeight: '600' },
    tipBox: { flexDirection: 'row', backgroundColor: '#FFF3CD', padding: 15, borderRadius: 12, marginBottom: 25, alignItems: 'center' },
    tipTitle: { fontWeight: 'bold', color: '#856404', marginBottom: 2 },
    tipText: { color: '#856404', fontSize: 13 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
    addShopBtn: { flexDirection: 'row', backgroundColor: THEME_COLOR, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    addShopText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 25 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME_COLOR, marginRight: 12 },
    ingredientText: { fontSize: 16, color: '#333' },
    stepsContainer: { marginTop: 10 },
    stepRow: { flexDirection: 'row', marginBottom: 20 },
    stepNumberBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    stepNumber: { fontWeight: 'bold', color: '#495057' },
    stepText: { flex: 1, fontSize: 16, color: '#333', lineHeight: 24 },
    deleteBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, marginTop: 30, borderWidth: 1, borderColor: '#ff4d4d', borderRadius: 12 },
    deleteText: { color: '#ff4d4d', fontWeight: 'bold', marginLeft: 8 },
});

export default RecipeModal;
