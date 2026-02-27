import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useGlobal } from '../context/GlobalContext';

export default function Index() {
    const { userToken, isLoading } = useGlobal();

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#00C2FF" />
            </View>
        );
    }

    if (userToken) {
        return <Redirect href="/(tabs)/feed" />;
    } else {
        return <Redirect href="/auth" />;
    }
}