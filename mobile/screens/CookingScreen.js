import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR } from '../constants/Config';

const CookingScreen = ({ userToken }) => {
    const [cookingTab, setCookingTab] = useState('shopping'); // shopping, timer, converter
    const [lists, setLists] = useState([]);
    const [activeListId, setActiveListId] = useState(null);
    const [shoppingItems, setShoppingItems] = useState([]);
    const [newListText, setNewListText] = useState('');
    const [newItemText, setNewItemText] = useState('');
    const [newQuantityText, setNewQuantityText] = useState('');

    // Sharing
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareListId, setShareListId] = useState(null);
    const [shareUsername, setShareUsername] = useState('');

    // Timer
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);

    // Converter
    const [convertValue, setConvertValue] = useState('');
    const [convertResult, setConvertResult] = useState('');

    useEffect(() => {
        if (cookingTab === 'shopping') loadLists();
    }, [cookingTab]);

    useEffect(() => {
        if (activeListId) loadItems(activeListId);
    }, [activeListId]);

    const loadLists = async () => {
        try {
            const r = await fetch(`${BASE_URL}/shopping-lists`, { headers: { 'Authorization': 'Bearer ' + userToken } });
            const d = await r.json();
            setLists(d);
            if (d.length > 0 && !activeListId) setActiveListId(d[0].id);
            else if (d.length === 0) setShoppingItems([]);
        } catch (e) { }
    };

    const loadItems = async (listId) => {
        try {
            const r = await fetch(`${BASE_URL}/shopping-lists/${listId}/items`, { headers: { 'Authorization': 'Bearer ' + userToken } });
            setShoppingItems(await r.json());
        } catch (e) { }
    };

    const createList = async () => {
        if (!newListText.trim()) return;
        try {
            const r = await fetch(`${BASE_URL}/shopping-lists`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken }, body: JSON.stringify({ name: newListText }) });
            const d = await r.json();
            setLists([...lists, d]);
            setActiveListId(d.id);
            setNewListText('');
        } catch (e) { }
    };

    const deleteList = async (id) => {
        try {
            await fetch(`${BASE_URL}/shopping-lists/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + userToken } });
            const newLists = lists.filter(l => l.id !== id);
            setLists(newLists);
            if (activeListId === id) setActiveListId(newLists.length > 0 ? newLists[0].id : null);
        } catch (e) { }
    };

    const shareList = async () => {
        if (!shareUsername.trim() || !shareListId) return;
        try {
            const r = await fetch(`${BASE_URL}/shopping-lists/${shareListId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
                body: JSON.stringify({ username: shareUsername.trim() })
            });
            const data = await r.json();
            if (r.ok) {
                Alert.alert("Erfolg", `Liste geteilt mit ${shareUsername}`);
                setShareModalVisible(false);
                setShareUsername('');
            } else {
                Alert.alert("Fehler", data.detail || data.message || "User nicht gefunden.");
            }
        } catch (e) {
            Alert.alert("Fehler", "Senden fehlgeschlagen.");
        }
    };

    const addShoppingItem = async () => {
        if (!newItemText.trim() || !activeListId) return;
        try {
            const r = await fetch(`${BASE_URL}/shopping-lists/${activeListId}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken }, body: JSON.stringify({ item: newItemText, quantity: newQuantityText }) });
            const d = await r.json();
            setShoppingItems([...shoppingItems, d]);
            setNewItemText('');
            setNewQuantityText('');
        } catch (e) { }
    };

    const updateShoppingItem = async (id, newItem, newQuantity) => {
        try {
            const r = await fetch(`${BASE_URL}/shopping-lists/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
                body: JSON.stringify({ item: newItem, quantity: newQuantity })
            });
            if (r.ok) {
                const d = await r.json();
                setShoppingItems(shoppingItems.map(i => i.id === id ? d : i));
            }
        } catch (e) { }
    };

    const toggleShoppingItem = async (id) => {
        const item = shoppingItems.find(i => i.id === id);
        const newState = !item.completed;
        setShoppingItems(shoppingItems.map(i => i.id === id ? { ...i, completed: newState } : i));
        try { await fetch(`${BASE_URL}/shopping-lists/items/${id}/toggle`, { method: 'POST', headers: { 'Authorization': 'Bearer ' + userToken } }); } catch (e) { }
    };

    const deleteShoppingItem = async (id) => {
        setShoppingItems(shoppingItems.filter(i => i.id !== id));
        try { await fetch(`${BASE_URL}/shopping-lists/items/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + userToken } }); } catch (e) { }
    };

    // Timer Logic
    useEffect(() => {
        if (isTimerRunning && timerSeconds > 0) {
            timerRef.current = setTimeout(() => setTimerSeconds(prev => prev - 1), 1000);
        } else if (timerSeconds === 0) {
            setIsTimerRunning(false);
            if (timerRef.current) clearTimeout(timerRef.current);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isTimerRunning, timerSeconds]);

    const formatTimer = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'black', paddingTop: 40 }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' }}>
                <Text style={styles.headerTitle}>Koch Modus 👨‍🍳</Text>
                <View style={{ flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 10, padding: 4 }}>
                    <TouchableOpacity onPress={() => setCookingTab('shopping')} style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: cookingTab === 'shopping' ? '#333' : 'transparent', borderRadius: 8 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Einkauf</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setCookingTab('timer')} style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: cookingTab === 'timer' ? '#333' : 'transparent', borderRadius: 8 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Timer</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setCookingTab('converter')} style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: cookingTab === 'converter' ? '#333' : 'transparent', borderRadius: 8 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Rechner</Text></TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1, padding: 20 }}>
                {cookingTab === 'shopping' && (
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                            <TextInput style={[styles.modernInput, { flex: 1, marginBottom: 0, marginRight: 10, padding: 10 }]} placeholder="Neue Liste erstellen..." placeholderTextColor="#666" value={newListText} onChangeText={setNewListText} />
                            <TouchableOpacity onPress={createList} style={{ backgroundColor: '#444', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 12 }}><Ionicons name="add" size={20} color="white" /></TouchableOpacity>
                        </View>

                        <View style={{ height: 50, marginBottom: 15 }}>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={lists}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item }) => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: activeListId === item.id ? THEME_COLOR : '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 }}>
                                        <TouchableOpacity onPress={() => setActiveListId(item.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {item.is_shared && <Ionicons name="people" size={14} color="white" style={{ marginRight: 5 }} />}
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</Text>
                                        </TouchableOpacity>
                                        
                                        {!item.is_shared && activeListId === item.id && (
                                            <TouchableOpacity onPress={() => { setShareListId(item.id); setShareModalVisible(true); }} style={{ marginLeft: 15 }}>
                                                <Ionicons name="share-social" size={18} color="white" />
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity onPress={() => deleteList(item.id)} style={{ marginLeft: item.is_shared || activeListId !== item.id ? 10 : 15 }}>
                                            <Ionicons name={item.is_shared ? "log-out-outline" : "close-circle"} size={18} color={item.is_shared ? "#ff4d4d" : "rgba(255,255,255,0.6)"} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                ListEmptyComponent={<Text style={{ color: '#666', fontStyle: 'italic', marginTop: 10 }}>Keine Listen vorhanden</Text>}
                            />
                        </View>

                        {activeListId ? (
                            <>
                                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                    <TextInput style={[styles.modernInput, { width: 80, marginBottom: 0, marginRight: 10, textAlign: 'center' }]} placeholder="Menge" placeholderTextColor="#666" value={newQuantityText} onChangeText={setNewQuantityText} />
                                    <TextInput style={[styles.modernInput, { flex: 1, marginBottom: 0, marginRight: 10 }]} placeholder="Neues Item..." placeholderTextColor="#666" value={newItemText} onChangeText={setNewItemText} />
                                    <TouchableOpacity onPress={addShoppingItem} style={{ backgroundColor: THEME_COLOR, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12 }}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>
                                </View>
                                <FlatList
                                    data={shoppingItems}
                                    keyExtractor={item => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 10 }}>
                                            <TouchableOpacity onPress={() => toggleShoppingItem(item.id)} style={{ marginRight: 15 }}>
                                                <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={24} color={item.completed ? THEME_COLOR : "#666"} />
                                            </TouchableOpacity>
                                            
                                            <View style={{ flex: 1, flexDirection: 'row', opacity: item.completed ? 0.5 : 1 }}>
                                                <TextInput 
                                                    style={{ color: 'white', fontSize: 16, width: 80, padding: 0, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 5, paddingHorizontal: 5, textAlign: 'center' }}
                                                    defaultValue={item.quantity}
                                                    placeholder="-"
                                                    placeholderTextColor="#444"
                                                    onEndEditing={(e) => updateShoppingItem(item.id, item.item, e.nativeEvent.text)}
                                                />
                                                <TextInput 
                                                    style={{ flex: 1, color: 'white', fontSize: 16, textDecorationLine: item.completed ? 'line-through' : 'none', padding: 0, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 5, paddingHorizontal: 5 }}
                                                    defaultValue={item.item}
                                                    onEndEditing={(e) => updateShoppingItem(item.id, e.nativeEvent.text, item.quantity)}
                                                />
                                            </View>

                                            <TouchableOpacity onPress={() => deleteShoppingItem(item.id)} style={{ marginLeft: 10 }}><Ionicons name="trash-outline" size={20} color="#ff4d4d" /></TouchableOpacity>
                                        </View>
                                    )}
                                    ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', marginTop: 30 }}>Diese Liste ist leer.</Text>}
                                />
                            </>
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="list-outline" size={60} color="#333" />
                                <Text style={{ color: '#555', marginTop: 10 }}>Wähle oder erstelle eine Liste</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* --- TIMER --- */}
                {cookingTab === 'timer' && (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 80, fontWeight: 'bold', color: 'white', fontVariant: ['tabular-nums'] }}>{formatTimer(timerSeconds)}</Text>
                        <View style={{ flexDirection: 'row', marginTop: 30 }}>
                            <TouchableOpacity onPress={() => { setTimerSeconds(timerSeconds + 60); }} style={styles.timerBtnSmall}><Text style={styles.timerBtnText}>+1m</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => { setTimerSeconds(timerSeconds + 300); }} style={styles.timerBtnSmall}><Text style={styles.timerBtnText}>+5m</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => { setTimerSeconds(timerSeconds + 600); }} style={styles.timerBtnSmall}><Text style={styles.timerBtnText}>+10m</Text></TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', marginTop: 30 }}>
                            <TouchableOpacity onPress={() => setIsTimerRunning(!isTimerRunning)} style={[styles.timerBtnMain, { backgroundColor: isTimerRunning ? '#ff4d4d' : '#2ecc71' }]}>
                                <Ionicons name={isTimerRunning ? "pause" : "play"} size={30} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setIsTimerRunning(false); setTimerSeconds(0); }} style={[styles.timerBtnMain, { backgroundColor: '#444', marginLeft: 20 }]}>
                                <Ionicons name="refresh" size={30} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {cookingTab === 'converter' && (
                    <View style={{ flex: 1, alignItems: 'center', paddingTop: 50 }}>
                        <Text style={{ color: '#888', marginBottom: 20 }}>Einfacher Umrechner (Cups zu ml)</Text>
                        <TextInput
                            style={[styles.modernInput, { width: '80%', textAlign: 'center', fontSize: 24 }]}
                            placeholder="Cups"
                            placeholderTextColor="#555"
                            keyboardType="numeric"
                            value={convertValue}
                            onChangeText={t => {
                                setConvertValue(t);
                                if (t && !isNaN(t)) setConvertResult((parseFloat(t) * 236.588).toFixed(0) + ' ml');
                                else setConvertResult('');
                            }}
                        />
                        <View style={{ marginTop: 20 }}><Ionicons name="arrow-down" size={30} color="#666" /></View>
                        <Text style={{ fontSize: 40, fontWeight: 'bold', color: THEME_COLOR, marginTop: 20 }}>{convertResult || '---'}</Text>
                    </View>
                )}
            </View>

            {/* SHARE MODAL */}
            <Modal visible={shareModalVisible} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: '#1a1a1a', padding: 25, borderRadius: 20, width: '100%', alignItems: 'center' }}>
                        <Ionicons name="people-circle" size={50} color={THEME_COLOR} style={{ marginBottom: 15 }} />
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 5 }}>Liste teilen</Text>
                        <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>Gib den exakten Usernamen ein, um diese Liste freizugeben.</Text>

                        <TextInput
                            style={[styles.modernInput, { width: '100%' }]}
                            placeholder="Username"
                            placeholderTextColor="#666"
                            value={shareUsername}
                            onChangeText={setShareUsername}
                            autoCapitalize="none"
                        />

                        <View style={{ flexDirection: 'row', marginTop: 10 }}>
                            <TouchableOpacity onPress={() => setShareModalVisible(false)} style={{ flex: 1, padding: 15, backgroundColor: '#333', borderRadius: 12, marginRight: 10, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Abbrechen</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={shareList} style={{ flex: 1, padding: 15, backgroundColor: THEME_COLOR, borderRadius: 12, marginLeft: 10, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Teilen</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    modernInput: { backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white', padding: 15, marginBottom: 15, fontSize: 16 },
    timerBtnSmall: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginHorizontal: 5 },
    timerBtnText: { color: 'white', fontWeight: 'bold' },
    timerBtnMain: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
});

export default CookingScreen;
