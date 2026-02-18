import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, THEME_COLOR } from '../constants/Config';

const AuthScreen = ({ onLoginSuccess, navigation }) => {
    const [authMode, setAuthMode] = useState('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [birthDate, setBirthDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [pwStrength, setPwStrength] = useState(0);
    const [passwordTips, setPasswordTips] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const calculateAge = (d) => { const t = new Date(); let a = t.getFullYear() - d.getFullYear(); if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--; return a; };

    const checkPasswordStrength = (p) => {
        setPassword(p);
        let s = 0, t = [];
        if (p.length < 10) t.push("Min. 10 Zeichen");
        if (!/[0-9]/.test(p)) t.push("Eine Zahl");
        if (!/[^A-Za-z0-9]/.test(p)) t.push("Ein Sonderzeichen");
        if (p.length > 0) s = 1;
        if (p.length > 7 && /[0-9]/.test(p)) s = 2;
        if (p.length > 9 && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) s = 3;
        setPwStrength(s);
        setPasswordTips(t);
    };

    const getStrengthColor = () => (pwStrength === 1 ? '#ff4d4d' : pwStrength === 2 ? '#ffcc00' : pwStrength === 3 ? '#2ecc71' : '#444');

    const handleAuth = async () => {
        setErrorMsg('');
        if (authMode === 'register') {
            const age = calculateAge(birthDate);
            if (!username || !email || !password || !confirmPassword) return setErrorMsg("Bitte fülle alle Felder aus! 📝");
            if (age < 16) return setErrorMsg(`Du bist erst ${age}. Komm wieder wenn du 16 bist! 🚫`);
            if (!email.includes('@') || !email.includes('.')) return setErrorMsg("Hmm, die Email sieht falsch aus. 🤔");
            if (password !== confirmPassword) return setErrorMsg("Die Passwörter stimmen nicht überein. 🔑");
            if (pwStrength < 3) return setErrorMsg("Dein Passwort ist noch zu unsicher. 🛡️");
        } else if (authMode === 'login') {
            if (!username || !password) return setErrorMsg("Bitte gib deine Daten ein. 🕵️‍♂️");
        } else if (authMode === 'verify') {
            if (!verificationCode || verificationCode.length !== 6) return setErrorMsg("Bitte gib den 6-stelligen Code ein. 🔢");
        }

        try {
            let ep, b;
            if (authMode === 'login') {
                ep = '/login';
                const f = new FormData();
                f.append('username', username);
                f.append('password', password);
                b = f;
            } else if (authMode === 'register') {
                ep = '/register';
                b = JSON.stringify({ username, email, password, age: calculateAge(birthDate) });
            } else if (authMode === 'verify') {
                ep = '/verify';
                b = JSON.stringify({ email: email, code: verificationCode }); // Email needed from state
            }

            const r = await fetch(`${BASE_URL}${ep}`, { method: 'POST', headers: (authMode === 'login' && ep !== '/verify') ? undefined : { 'Content-Type': 'application/json' }, body: b });
            const d = await r.json();

            if (!r.ok) {
                if (r.status === 403 && d.detail && d.detail.includes("verifiziert")) {
                    // Login failed because unverified -> switch to verify
                    setAuthMode('verify');
                    // If we have email in state (from login input if it was email), great. 
                    // But username input can be username OR email. 
                    // If it's username, we might need to ask for email or the backend needs to handle resend by username (which it doesn't currently).
                    // Ideally, login return should maybe give a hint or we just ask user to enter email if we don't have it.
                    // For now assume user can re-enter email or we caught it from register.
                    if (email) {
                        setErrorMsg("Bitte verifiziere deine Email! Code wurde gesendet. 📧");
                    } else {
                        // If we only have username, we might be stuck if we don't know email. 
                        // But if they just registered, we have email.
                        setErrorMsg("Account nicht verifiziert. Bitte registriere dich neu oder nutze die Email zum Login.");
                        // Actually, if they try to login with username and fail 403, we don't have email to verify with.
                        // But for now let's assume register flow -> verify.
                        // Or user types email in login field.
                        if (username.includes('@')) setEmail(username);
                    }
                    return;
                }
                if (d.detail === "Falscher Username oder Passwort") throw new Error("Falsche Zugangsdaten! ❌");
                throw new Error(d.detail || "Ein Fehler ist aufgetreten.");
            }

            if (authMode === 'register') {
                // Register success -> now verification code sent
                setAuthMode('verify');
                setErrorMsg("Code gesendet! Bitte Check deine Mails. 📧");
            } else if (authMode === 'verify') {
                // Verify success -> d should be token
                await AsyncStorage.setItem('userToken', d.access_token);
                onLoginSuccess(d.access_token, true);
            } else {
                // Login success
                await AsyncStorage.setItem('userToken', d.access_token);
                onLoginSuccess(d.access_token, false);
            }

            if (authMode !== 'verify' && authMode !== 'register') {
                setUsername(''); setPassword(''); setEmail(''); setErrorMsg('');
            }
        } catch (e) {
            setErrorMsg(e.message);
        }
    };

    const handleResend = async () => {
        if (!email) return setErrorMsg("Bitte Email eingeben für erneuten Code.");
        try {
            await fetch(`${BASE_URL}/resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, code: "000000" })
            });
            setErrorMsg("Neuer Code gesendet! 📨");
        } catch (e) {
            setErrorMsg("Fehler beim Senden.");
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authContainer}>
            <Text style={styles.appLogo}>RezeptTok 🍳</Text>
            <View style={{ marginBottom: 30 }}>
                <Text style={styles.authTitle}>
                    {authMode === 'login' ? 'Willkommen zurück! 👋' : authMode === 'register' ? 'Deine Reise beginnt! 🚀' : 'Code eingeben 🔐'}
                </Text>
                <Text style={styles.authSubText}>
                    {authMode === 'login' ? 'Logge dich ein und entdecke neue Rezepte.' : authMode === 'register' ? 'Erstelle ein Konto und werde Teil der Community.' : `Code wurde an ${email} gesendet.`}
                </Text>
            </View>
            {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>{errorMsg}</Text></View> : null}

            <View style={styles.formContainer}>
                {authMode !== 'verify' && (
                    <TextInput style={styles.modernInput} placeholder={authMode === 'login' ? "Dein Nutzername" : "Nutzername wählen"} placeholderTextColor="#888" value={username} onChangeText={setUsername} autoCapitalize="none" />
                )}

                {authMode === 'register' && (
                    <>
                        <TextInput style={styles.modernInput} placeholder="Deine E-Mail Adresse" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                        {Platform.OS === 'web' ? (
                            <View style={[styles.modernInput, { paddingVertical: 10 }]}>
                                <Text style={{ color: '#888', fontSize: 12, marginBottom: 5 }}>Geburtsdatum</Text>
                                {React.createElement('input', {
                                    type: 'date',
                                    value: birthDate.toISOString().split('T')[0],
                                    onChange: (e) => setBirthDate(new Date(e.target.value)),
                                    style: {
                                        backgroundColor: 'transparent',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: 16,
                                        width: '100%',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        colorScheme: 'dark'
                                    }
                                })}
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)} style={styles.modernDateBtn}>
                                    <Text style={{ color: '#ccc', fontSize: 14, marginRight: 10 }}>Geburtsdatum:</Text>
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{birthDate.toLocaleDateString('de-DE')}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#888" style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <View style={styles.datePickerContainer}>
                                        <DateTimePicker value={birthDate} mode="date" display="spinner" themeVariant="dark" textColor="white" maximumDate={new Date()} onChange={(e, d) => { if (Platform.OS === 'android') setShowDatePicker(false); if (d) setBirthDate(d); }} style={{ height: 120 }} />
                                        {Platform.OS === 'ios' && <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closePickerBtn}><Text style={{ color: THEME_COLOR }}>Fertig</Text></TouchableOpacity>}
                                    </View>
                                )}
                            </>
                        )}
                    </>
                )}

                {authMode !== 'verify' && authMode === 'register' && (
                    <View style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
                        <TextInput
                            style={[styles.modernInput, { marginBottom: 0, paddingRight: 50, borderColor: '#333', borderWidth: 1 }]}
                            placeholder="Dein Passwort"
                            placeholderTextColor="#888"
                            value={password}
                            onChangeText={checkPasswordStrength}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 15, top: 15, zIndex: 10 }}>
                            <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="#888" />
                        </TouchableOpacity>
                    </View>
                )}

                {authMode !== 'verify' && authMode === 'login' && (
                    <View style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
                        <TextInput
                            style={[styles.modernInput, { marginBottom: 0, paddingRight: 50, borderColor: '#333', borderWidth: 1 }]}
                            placeholder="Dein Passwort"
                            placeholderTextColor="#888"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 15, top: 15, zIndex: 10 }}>
                            <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="#888" />
                        </TouchableOpacity>
                    </View>
                )}

                {authMode === 'register' && password.length > 0 && (
                    <View style={{ marginTop: 5, marginBottom: 15 }}>
                        <View style={{ height: 4, flexDirection: 'row', borderRadius: 2, overflow: 'hidden', backgroundColor: '#333' }}>
                            <View style={{ flex: 1, backgroundColor: getStrengthColor(), marginRight: 2 }} />
                            <View style={{ flex: 1, backgroundColor: pwStrength >= 2 ? getStrengthColor() : '#333', marginRight: 2 }} />
                            <View style={{ flex: 1, backgroundColor: pwStrength === 3 ? getStrengthColor() : '#333' }} />
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
                            {passwordTips.map((tip, index) => <Text key={index} style={{ color: '#888', fontSize: 11, marginRight: 8 }}>• {tip}</Text>)}
                        </View>
                    </View>
                )}

                {authMode === 'register' && (
                    <View style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
                        <TextInput
                            style={[styles.modernInput, { marginBottom: 0, paddingRight: 50, borderColor: '#333', borderWidth: 1 }]}
                            placeholder="Passwort wiederholen"
                            placeholderTextColor="#888"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 15, top: 15, zIndex: 10 }}>
                            <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={24} color="#888" />
                        </TouchableOpacity>
                    </View>
                )}

                {authMode === 'verify' && (
                    <View>
                        <TextInput
                            style={[styles.modernInput, { textAlign: 'center', letterSpacing: 5, fontSize: 24, fontWeight: 'bold' }]}
                            placeholder="123456"
                            placeholderTextColor="#555"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        <TouchableOpacity onPress={handleResend} style={{ alignSelf: 'center', marginBottom: 20 }}>
                            <Text style={{ color: THEME_COLOR }}>Code erneut senden</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
                    <Text style={styles.primaryButtonText}>{authMode === 'login' ? 'Jetzt Einloggen' : authMode === 'register' ? 'Kostenlos Registrieren' : 'Code Bestätigen'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20, padding: 10 }} onPress={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setErrorMsg(''); }}>
                    <Text style={{ color: '#aaa', textAlign: 'center' }}>
                        {authMode === 'login' ? 'Noch keinen Account? ' : 'Du bist schon dabei? '}
                        <Text style={{ color: THEME_COLOR, fontWeight: 'bold' }}>{authMode === 'login' ? 'Hier registrieren' : 'Hier einloggen'}</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    authContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', padding: 20 },
    appLogo: { fontSize: 40, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 40 },
    authTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
    authSubText: { color: '#888', fontSize: 16 },
    errorBox: { backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.3)' },
    errorText: { color: '#ff4d4d', textAlign: 'center' },
    formContainer: { width: '100%' },
    modernInput: { backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white', padding: 15, marginBottom: 15, fontSize: 16 },
    modernDateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 15 },
    datePickerContainer: { backgroundColor: '#1f1f1f', borderRadius: 15, padding: 10, marginBottom: 15 },
    closePickerBtn: { alignSelf: 'flex-end', padding: 10 },
    primaryButton: { backgroundColor: THEME_COLOR, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default AuthScreen;
