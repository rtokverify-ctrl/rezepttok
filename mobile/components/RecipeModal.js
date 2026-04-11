import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Dimensions, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../constants/Config';
import { useGlobal } from '../context/GlobalContext';

const { width, height } = Dimensions.get('window');

const RecipeModal = ({ visible, onClose, selectedRecipe, deleteRecipe, userToken }) => {
    const { themeColor, updateRecipe } = useGlobal();
    const styles = getStyles(themeColor);

    const [addingToShop, setAddingToShop] = useState(false);
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editIngredients, setEditIngredients] = useState('');
    const [editSteps, setEditSteps] = useState('');
    const [editTags, setEditTags] = useState('');
    const [editTips, setEditTips] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Reset edit state when recipe changes or modal closes
    useEffect(() => {
        if (!visible) {
            setIsEditing(false);
        }
    }, [visible]);

    const enterEditMode = () => {
        if (!selectedRecipe) return;
        setEditTitle(selectedRecipe.title || '');
        setEditIngredients(
            selectedRecipe.ingredients?.map(i => i.name).join('\n') || ''
        );
        setEditSteps(
            selectedRecipe.steps?.map(s => s.instruction).join('\n') || ''
        );
        setEditTags(
            selectedRecipe.tags?.join(', ') || ''
        );
        setEditTips(selectedRecipe.tips || '');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedRecipe) return;
        setIsSaving(true);
        
        const updateData = {
            title: editTitle,
            ingredients: editIngredients.split('\n').filter(l => l.trim()).map(l => ({ name: l.trim(), amount: "1", unit: "x" })),
            steps: editSteps.split('\n').filter(l => l.trim()).map((l, i) => ({ order: i + 1, instruction: l.trim() })),
            tags: editTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            tips: editTips || null
        };

        const result = await updateRecipe(selectedRecipe.id, updateData);
        setIsSaving(false);

        if (result) {
            // Update the selectedRecipe in place so the modal shows updated data
            selectedRecipe.title = result.title;
            selectedRecipe.ingredients = result.ingredients;
            selectedRecipe.steps = result.steps;
            selectedRecipe.tags = result.tags;
            selectedRecipe.tips = result.tips;
            setIsEditing(false);
            Alert.alert("Gespeichert", "Dein Rezept wurde aktualisiert! ✅");
        } else {
            Alert.alert("Fehler", "Konnte die Änderungen nicht speichern.");
        }
    };

    const addToShoppingList = async () => {
        if (!selectedRecipe?.ingredients) return;
        setAddingToShop(true);
        try {
            // 1. Fetch existing lists
            let listId = null;
            const res = await fetch(`${BASE_URL}/shopping-lists`, { headers: { 'Authorization': 'Bearer ' + userToken } });
            const lists = await res.json();
            
            if (lists.length > 0) {
                listId = lists[0].id;
            } else {
                // Create a default list if none exist
                const lRes = await fetch(`${BASE_URL}/shopping-lists`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
                    body: JSON.stringify({ name: 'Rezept Zutaten' }) 
                });
                const newList = await lRes.json();
                listId = newList.id;
            }

            // Helper: Versuch, Menge und Item zu trennen (sehr simpel)
            const parseIngredient = (text) => {
                const match = text.match(/^([\d.,]+\s*(?:g|ml|TL|EL|Prise|Stk|Tasse|Kasten|l|kg|Pck|Bund)?)\s+(.+)$/i);
                if (match) {
                    return { quantity: match[1].trim(), item: match[2].trim() };
                }
                return { quantity: '', item: text.trim() };
            };

            // 2. Add all ingredients to the found list
            const promises = selectedRecipe.ingredients.map(ing => {
                const parsed = parseIngredient(ing.name);
                return fetch(`${BASE_URL}/shopping-lists/${listId}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
                    body: JSON.stringify({ item: parsed.item, quantity: parsed.quantity })
                });
            });
            await Promise.all(promises);
            Alert.alert("Erfolg", "Zutaten wurden in deine Einkaufsliste gepackt! 🛒");
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

                        <TouchableOpacity onPress={() => { setIsEditing(false); onClose(); }} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>

                        {isEditing ? (
                            <TextInput
                                style={styles.titleEdit}
                                value={editTitle}
                                onChangeText={setEditTitle}
                                placeholder="Titel"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                            />
                        ) : (
                            <Text style={styles.title}>{selectedRecipe.title}</Text>
                        )}
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
                        {isEditing ? (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={styles.editLabel}>Tags (kommagetrennt)</Text>
                                <TextInput
                                    style={styles.editInput}
                                    value={editTags}
                                    onChangeText={setEditTags}
                                    placeholder="Vegan, Schnell, Asiatisch"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        ) : (
                            selectedRecipe.tags && (
                                <View style={styles.tagRow}>
                                    {selectedRecipe.tags.map((t, i) => (
                                        <View key={i} style={styles.tag}>
                                            <Text style={styles.tagText}>#{t}</Text>
                                        </View>
                                    ))}
                                </View>
                            )
                        )}

                        {/* Tips */}
                        {isEditing ? (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={styles.editLabel}>Chef Tipp</Text>
                                <TextInput
                                    style={[styles.editInput, { minHeight: 60 }]}
                                    value={editTips}
                                    onChangeText={setEditTips}
                                    placeholder="Dein Geheimtipp (optional)"
                                    placeholderTextColor="#999"
                                    multiline
                                />
                            </View>
                        ) : (
                            selectedRecipe.tips && (
                                <View style={styles.tipBox}>
                                    <Ionicons name="bulb" size={24} color="#F59E0B" style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.tipTitle}>Chef Tipp</Text>
                                        <Text style={styles.tipText}>{selectedRecipe.tips}</Text>
                                    </View>
                                </View>
                            )
                        )}

                        {/* Ingredients */}
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Zutaten</Text>
                            {!isEditing && (
                                <TouchableOpacity onPress={addToShoppingList} disabled={addingToShop} style={styles.addShopBtn}>
                                    {addingToShop ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="cart-outline" size={20} color="white" />}
                                    <Text style={styles.addShopText}>Alle hinzufügen</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {isEditing ? (
                            <TextInput
                                style={[styles.editInput, { minHeight: 120 }]}
                                value={editIngredients}
                                onChangeText={setEditIngredients}
                                placeholder="Eine Zutat pro Zeile"
                                placeholderTextColor="#999"
                                multiline
                            />
                        ) : (
                            <View style={styles.card}>
                                {selectedRecipe.ingredients?.map((ing, i) => (
                                    <View key={i} style={styles.ingredientRow}>
                                        <View style={styles.bullet} />
                                        <Text style={styles.ingredientText}>{ing.name}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Steps */}
                        <Text style={[styles.sectionTitle, { marginTop: isEditing ? 20 : 0 }]}>Zubereitung</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.editInput, { minHeight: 150, marginTop: 10 }]}
                                value={editSteps}
                                onChangeText={setEditSteps}
                                placeholder="Ein Schritt pro Zeile"
                                placeholderTextColor="#999"
                                multiline
                            />
                        ) : (
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
                        )}

                        {/* Action Buttons (Owner) */}
                        {selectedRecipe.is_mine && (
                            <View style={styles.ownerActions}>
                                {isEditing ? (
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                                            <Ionicons name="close-outline" size={20} color="#888" />
                                            <Text style={styles.cancelText}>Abbrechen</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
                                            {isSaving ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <Ionicons name="checkmark" size={20} color="white" />
                                            )}
                                            <Text style={styles.saveText}>Speichern</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity onPress={enterEditMode} style={styles.editBtn}>
                                            <Ionicons name="create-outline" size={20} color={themeColor} />
                                            <Text style={styles.editText}>Bearbeiten</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={deleteRecipe} style={styles.deleteBtn}>
                                            <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
                                            <Text style={styles.deleteText}>Löschen</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    imageContainer: { width: '100%', height: 350, position: 'relative' },
    image: { width: '100%', height: '100%' },
    gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
    closeBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, zIndex: 10 },
    title: { position: 'absolute', bottom: 40, left: 20, right: 20, color: 'white', fontSize: 28, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
    titleEdit: { position: 'absolute', bottom: 35, left: 20, right: 20, color: 'white', fontSize: 24, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10 },
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
    addShopBtn: { flexDirection: 'row', backgroundColor: themeColor, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    addShopText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 25 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: themeColor, marginRight: 12 },
    ingredientText: { fontSize: 16, color: '#333' },
    stepsContainer: { marginTop: 10 },
    stepRow: { flexDirection: 'row', marginBottom: 20 },
    stepNumberBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    stepNumber: { fontWeight: 'bold', color: '#495057' },
    stepText: { flex: 1, fontSize: 16, color: '#333', lineHeight: 24 },
    
    // Owner action buttons
    ownerActions: { marginTop: 30, alignItems: 'center' },
    editBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flex: 1, padding: 15, borderWidth: 1.5, borderColor: themeColor, borderRadius: 12 },
    editText: { color: themeColor, fontWeight: 'bold', marginLeft: 8 },
    deleteBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flex: 1, padding: 15, borderWidth: 1, borderColor: '#ff4d4d', borderRadius: 12 },
    deleteText: { color: '#ff4d4d', fontWeight: 'bold', marginLeft: 8 },
    saveBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flex: 1, padding: 15, backgroundColor: themeColor, borderRadius: 12 },
    saveText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
    cancelBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flex: 1, padding: 15, backgroundColor: '#e9ecef', borderRadius: 12 },
    cancelText: { color: '#666', fontWeight: 'bold', marginLeft: 8 },

    // Edit mode inputs
    editLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 6 },
    editInput: { backgroundColor: 'white', borderRadius: 12, padding: 15, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#e0e0e0', textAlignVertical: 'top' },
});

export default RecipeModal;
