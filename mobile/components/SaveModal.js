import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLOR } from '../constants/Config';

const SaveModal = ({ visible, onClose, collections, currentRecipeCollections = [], toggleCollectionForRecipe, createCollection, isCreatingCollection, setIsCreatingCollection, newCollectionName, setNewCollectionName }) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: '40%' }]}>
                    <View style={styles.modalHandle} />
                    <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginVertical: 15 }}>In Ordner speichern</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
                        <TouchableOpacity onPress={() => setIsCreatingCollection(true)} style={styles.collectionCard}>
                            <View style={[styles.collectionIcon, { backgroundColor: '#eee' }]}><Ionicons name="add" size={30} color="black" /></View>
                            <Text style={styles.collectionText}>Neu</Text>
                        </TouchableOpacity>
                        {(Array.isArray(collections) ? collections : []).map(col => {
                            const isSelected = currentRecipeCollections.includes(col.id);
                            return (
                                <TouchableOpacity key={col.id ? col.id.toString() : Math.random().toString()} onPress={() => toggleCollectionForRecipe(col.id)} style={styles.collectionCard}>
                                    <View style={[styles.collectionIcon, isSelected && { backgroundColor: THEME_COLOR }]}>
                                        <Ionicons name={isSelected ? "checkmark" : "folder"} size={30} color={isSelected ? "white" : "white"} />
                                    </View>
                                    <Text style={styles.collectionText} numberOfLines={1}>{col.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    {isCreatingCollection && (
                        <View style={{ padding: 20, borderTopWidth: 1, borderColor: '#eee' }}>
                            <TextInput style={{ backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8 }} placeholder="Ordner Name" value={newCollectionName} onChangeText={setNewCollectionName} autoFocus />
                            <TouchableOpacity onPress={createCollection} style={{ marginTop: 10, backgroundColor: THEME_COLOR, padding: 10, borderRadius: 8, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Erstellen</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 10, right: 15 }}><Ionicons name="close" size={24} color="#999" /></TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    collectionCard: { marginRight: 15, alignItems: 'center', width: 80 },
    collectionIcon: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    collectionText: { fontSize: 12, textAlign: 'center' },
});

export default SaveModal;
