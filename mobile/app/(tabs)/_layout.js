import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME_COLOR, NAVBAR_HEIGHT } from '../../constants/Config';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    height: NAVBAR_HEIGHT,
                    backgroundColor: 'black',
                    borderTopWidth: 1,
                    borderTopColor: '#222',
                    position: 'absolute',
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: '#555',
            }}
        >
            <Tabs.Screen
                name="feed"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="cooking"
                options={{
                    title: 'Cooking',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chef-hat" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="upload"
                options={{
                    title: 'Upload',
                    tabBarIcon: ({ color }) => (
                        <View style={{ width: 45, height: 30, borderRadius: 8, overflow: 'hidden' }}>
                            <LinearGradient colors={[THEME_COLOR, '#33CCFF']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="add" size={28} color="white" />
                            </LinearGradient>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Notifications',
                    tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
