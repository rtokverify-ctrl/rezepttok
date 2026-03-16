import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLOR } from '../constants/Config';

const SaveModal = ({ visible, onClose, collections, currentRecipeCollections = [], toggleCollectionForRecipe, createCollection, isCreatingCollection, setIsCreatingCollection, newCollectionName, setNewCollectionName, onGlobalSave }) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: '40%' }]}>
                    <View style={styles.modalHandle} />
                    <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginVertical: 15, color: 'white' }}>Rezept speichern</Text>

                    <TouchableOpacity onPress={onGlobalSave} style={{ alignSelf: 'center', backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 15 }}>
                        <Text style={{ fontWeight: 'bold', color: 'white' }}>⚡ Schnell-Speichern (Ohne Ordner)</Text>
                    </TouchableOpacity>

                    <Text style={{ marginLeft: 20, fontWeight: 'bold', marginBottom: 10, color: '#aaa' }}>In Ordner:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
                        <TouchableOpacity onPress={() => setIsCreatingCollection(true)} style={styles.collectionCard}>
                            <View style={[styles.collectionIcon, { backgroundColor: '#222' }]}><Ionicons name="add" size={30} color="white" /></View>
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
                        <View style={{ padding: 20, borderTopWidth: 1, borderColor: '#222' }}>
                            <TextInput style={{ backgroundColor: '#222', color: 'white', padding: 12, borderRadius: 12, fontSize: 16 }} placeholder="Ordner Name" placeholderTextColor="#888" value={newCollectionName} onChangeText={setNewCollectionName} autoFocus />
                            <TouchableOpacity onPress={createCollection} style={{ marginTop: 12, backgroundColor: THEME_COLOR, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Erstellen</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 15, right: 15 }}><Ionicons name="close" size={26} color="white" /></TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    collectionCard: { marginRight: 15, alignItems: 'center', width: 80 },
    collectionIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    collectionText: { fontSize: 12, textAlign: 'center', color: '#ddd' },
});

export default SaveModal;
