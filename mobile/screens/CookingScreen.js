import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR } from '../constants/Config';

const CookingScreen = ({ userToken }) => {
    const [cookingTab, setCookingTab] = useState('shopping'); // shopping, timer, converter
    const [shoppingList, setShoppingList] = useState([]);
    const [newItemText, setNewItemText] = useState('');

    // Timer
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);

    // Converter
    const [convertValue, setConvertValue] = useState('');
    const [convertResult, setConvertResult] = useState('');

    useEffect(() => {
        loadShoppingList();
    }, []);

    const loadShoppingList = async () => {
        try {
            const r = await fetch(`${BASE_URL}/shopping-list`, { headers: { 'Authorization': 'Bearer ' + userToken } });
            const d = await r.json();
            setShoppingList(d);
        } catch (e) { }
    };

    const addShoppingItem = async () => {
        if (!newItemText.trim()) return;
        try {
            const r = await fetch(`${BASE_URL}/shopping-list`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken }, body: JSON.stringify({ item: newItemText }) });
            const d = await r.json();
            setShoppingList([...shoppingList, d]);
            setNewItemText('');
        } catch (e) { }
    };

    const toggleShoppingItem = async (id) => {
        const item = shoppingList.find(i => i.id === id);
        const newState = !item.completed;
        setShoppingList(shoppingList.map(i => i.id === id ? { ...i, completed: newState } : i));
        try { await fetch(`${BASE_URL}/shopping-list/${id}/toggle`, { method: 'POST', headers: { 'Authorization': 'Bearer ' + userToken } }); } catch (e) { }
    };

    const deleteShoppingItem = async (id) => {
        setShoppingList(shoppingList.filter(i => i.id !== id));
        try { await fetch(`${BASE_URL}/shopping-list/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + userToken } }); } catch (e) { }
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
                    <TouchableOpacity onPress={() => setCookingTab('shopping')} style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: cookingTab === 'shopping' ? '#333' : 'transparent', borderRadius: 8 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Einkaufsliste</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setCookingTab('timer')} style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: cookingTab === 'timer' ? '#333' : 'transparent', borderRadius: 8 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Timer</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setCookingTab('converter')} style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: cookingTab === 'converter' ? '#333' : 'transparent', borderRadius: 8 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>Rechner</Text></TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1, padding: 20 }}>
                {cookingTab === 'shopping' && (
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            <TextInput style={[styles.modernInput, { flex: 1, marginBottom: 0, marginRight: 10 }]} placeholder="Neues Item..." placeholderTextColor="#666" value={newItemText} onChangeText={setNewItemText} />
                            <TouchableOpacity onPress={addShoppingItem} style={{ backgroundColor: THEME_COLOR, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12 }}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>
                        </View>
                        <FlatList
                            data={shoppingList}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 10 }}>
                                    <TouchableOpacity onPress={() => toggleShoppingItem(item.id)} style={{ marginRight: 15 }}>
                                        <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={24} color={item.completed ? THEME_COLOR : "#666"} />
                                    </TouchableOpacity>
                                    <Text style={{ flex: 1, color: item.completed ? '#666' : 'white', textDecorationLine: item.completed ? 'line-through' : 'none', fontSize: 16 }}>{item.item}</Text>
                                    <TouchableOpacity onPress={() => deleteShoppingItem(item.id)}><Ionicons name="trash-outline" size={20} color="#ff4d4d" /></TouchableOpacity>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', marginTop: 30 }}>Deine Liste ist leer.</Text>}
                        />
                    </View>
                )}

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
