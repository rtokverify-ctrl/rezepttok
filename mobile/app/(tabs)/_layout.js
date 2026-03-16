import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { THEME_COLOR, BG_DARK, BG_LIGHT, NAVBAR_HEIGHT } from '../../constants/Config';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    elevation: 0,
                    height: NAVBAR_HEIGHT,
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : `${BG_DARK}f2`, // f2 for 95% opacity hex
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                    paddingBottom: 10,
                    paddingTop: 5,
                },
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
                    ) : null
                ),
                tabBarShowLabel: true,
                tabBarActiveTintColor: THEME_COLOR,
                tabBarInactiveTintColor: '#94a3b8', // slate-400
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                }
            }}
        >
            <Tabs.Screen
                name="feed"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ color }) => <MaterialIcons name="explore" size={26} color={color} />, // compass like explore
                }}
            />
            <Tabs.Screen
                name="upload"
                options={{
                    title: 'Create',
                    tabBarLabel: ({ focused }) => (
                         <View><MaterialIcons name="circle" size={0} color="transparent"/><View style={{marginTop: -4}}><MaterialIcons name="circle" size={0}/></View></View> // visually hidden text
                    ), 
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            marginTop: -28, // Floating effect
                            shadowColor: THEME_COLOR,
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.4,
                            shadowRadius: 10,
                            elevation: 8,
                        }}>
                            <View style={{
                                width: 56, 
                                height: 56, 
                                borderRadius: 28, 
                                backgroundColor: THEME_COLOR, 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                borderWidth: 4,
                                borderColor: BG_DARK
                            }}>
                                <MaterialIcons name="add" size={32} color="white" />
                            </View>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color }) => <MaterialIcons name="notifications" size={26} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <MaterialIcons name="person" size={26} color={color} />,
                }}
            />
            {/* Hidden screens from the main tab bar */}
            <Tabs.Screen
                name="cooking"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
