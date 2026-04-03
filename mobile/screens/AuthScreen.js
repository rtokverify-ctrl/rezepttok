import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { BASE_URL,  BG_DARK } from '../constants/Config';
import { useGlobal } from '../context/GlobalContext';

const AuthScreen = ({ onLoginSuccess, navigation }) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

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
                // Auto-login since email verification is disabled in the backend
                if (d.access_token) {
                    await AsyncStorage.setItem('userToken', d.access_token);
                    onLoginSuccess(d.access_token, false);
                } else {
                    setAuthMode('verify');
                    setErrorMsg("Code gesendet! Bitte Check deine Mails. 📧");
                }
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
        <View style={styles.outerContainer}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                        {/* Central Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoBox}>
                                <MaterialIcons name="restaurant-menu" size={40} color="white" />
                            </View>
                        </View>

                        <View style={{ marginBottom: 30 }}>
                            <Text style={styles.authTitle}>
                                {authMode === 'login' ? 'Willkommen' : authMode === 'register' ? 'Registrieren' : 'Verifizieren'}
                            </Text>
                            <Text style={styles.authSubText}>
                                {authMode === 'login' ? 'Entdecke neue Rezepte und koche mit Leidenschaft' : authMode === 'register' ? 'Erstelle ein Konto und werde Teil der Community' : `Code wurde an ${email} gesendet`}
                            </Text>
                        </View>
            {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>{errorMsg}</Text></View> : null}

            <View style={styles.formContainer}>
                {authMode !== 'verify' && (
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="person" size={20} color="#c084fc" style={styles.inputIcon} />
                        <TextInput style={styles.modernInput} placeholder={authMode === 'login' ? "Dein Nutzername" : "Nutzername wählen"} placeholderTextColor="#52525b" value={username} onChangeText={setUsername} autoCapitalize="none" />
                    </View>
                )}

                {authMode === 'register' && (
                    <>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="mail" size={20} color="#c084fc" style={styles.inputIcon} />
                            <TextInput style={styles.modernInput} placeholder="name@beispiel.de" placeholderTextColor="#52525b" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                        </View>
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
                                        {Platform.OS === 'ios' && <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closePickerBtn}><Text style={{ color: themeColor }}>Fertig</Text></TouchableOpacity>}
                                    </View>
                                )}
                            </>
                        )}
                    </>
                )}

                {authMode !== 'verify' && authMode === 'register' && (
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="lock" size={20} color="#c084fc" style={styles.inputIcon} />
                        <TextInput
                            style={styles.modernInput}
                            placeholder="Dein Passwort"
                            placeholderTextColor="#52525b"
                            value={password}
                            onChangeText={checkPasswordStrength}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconToggle}>
                            <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#c084fc" />
                        </TouchableOpacity>
                    </View>
                )}

                {authMode !== 'verify' && authMode === 'login' && (
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="lock" size={20} color="#c084fc" style={styles.inputIcon} />
                        <TextInput
                            style={styles.modernInput}
                            placeholder="Dein Passwort"
                            placeholderTextColor="#52525b"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconToggle}>
                            <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#c084fc" />
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
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="lock" size={20} color="#c084fc" style={styles.inputIcon} />
                        <TextInput
                            style={styles.modernInput}
                            placeholder="••••••••"
                            placeholderTextColor="#52525b"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIconToggle}>
                            <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={20} color="#c084fc" />
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
                            <Text style={{ color: themeColor }}>Code erneut senden</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
                    <Text style={styles.primaryButtonText}>{authMode === 'login' ? 'Jetzt Einloggen' : authMode === 'register' ? 'Kostenlos Registrieren' : 'Code Bestätigen'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20, padding: 10 }} onPress={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setErrorMsg(''); }}>
                    <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 14 }}>
                        {authMode === 'login' ? 'Noch kein Konto? ' : 'Du bist schon dabei? '}
                        <Text style={{ color: themeColor, fontWeight: 'bold' }}>{authMode === 'login' ? 'Jetzt registrieren' : 'Hier einloggen'}</Text>
                    </Text>
                </TouchableOpacity>
            </View>
                    </BlurView>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: 'black' },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    glassCard: { 
        width: '100%', 
        maxWidth: 400, 
        alignSelf: 'center',
        backgroundColor: 'rgba(24, 24, 27, 0.4)', // bg-zinc-950/40
        borderRadius: 40, // rounded-[2.5rem]
        paddingHorizontal: 30, // px-8
        paddingTop: 30, // pt-8
        paddingBottom: 40, // pb-12
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden'
    },
    logoContainer: { alignItems: 'center', marginBottom: 24 },
    logoBox: {
        width: 80, height: 80,
        backgroundColor: themeColor,
        borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: themeColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10
    },
    authTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 8 },
    authSubText: { color: '#71717a', fontSize: 14, textAlign: 'center' }, // text-zinc-500
    errorBox: { backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.3)' },
    errorText: { color: '#ff4d4d', textAlign: 'center', fontSize: 14, fontWeight: '500' },
    formContainer: { width: '100%' },
    inputWrapper: { position: 'relative', width: '100%', marginBottom: 16 },
    inputIcon: { position: 'absolute', left: 16, top: 18, zIndex: 10 },
    eyeIconToggle: { position: 'absolute', right: 16, top: 18, zIndex: 10 },
    modernInput: { 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', 
        borderRadius: 16, 
        color: 'white', 
        paddingVertical: 18, 
        paddingLeft: 48, 
        paddingRight: 16, 
        fontSize: 15 
    },
    modernDateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18, borderRadius: 16, marginBottom: 16 },
    datePickerContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 10, marginBottom: 16 },
    closePickerBtn: { alignSelf: 'flex-end', padding: 10 },
    primaryButton: { 
        backgroundColor: themeColor, 
        paddingVertical: 18, 
        borderRadius: 16, 
        alignItems: 'center', 
        marginTop: 10,
        shadowColor: themeColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5
    },
    primaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default AuthScreen;
