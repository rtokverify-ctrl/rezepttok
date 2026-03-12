import React from 'react';
import { View, Image, Text, Button, StyleSheet } from 'react-native';

const ProfileHeader = ({ user }) => {
  return (
    <View style={styles.header}>
      <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      <Text style={styles.username}>{user.username}</Text>
      <Button title='Follow' onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  username: { marginLeft: 10, flex: 1, fontSize: 18 }
});
export default ProfileHeader;
