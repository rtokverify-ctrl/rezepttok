import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME_COLOR } from '../constants/Config';

const ProfileHeader = ({ user, onFollow }) => {
  return (
    <View style={styles.header}>
      <Image source={{ uri: user?.avatar_url }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{user?.username}</Text>
      </View>
      <TouchableOpacity style={styles.followButton} onPress={onFollow} activeOpacity={0.7}>
        <Text style={styles.followText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  userInfo: { flex: 1, marginLeft: 12 },
  username: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  followButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24
  },
  followText: { color: 'white', fontWeight: 'bold' }
});
export default ProfileHeader;
