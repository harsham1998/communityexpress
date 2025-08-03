import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const JoinCommunityScreen = () => {
  const [communityCode, setCommunityCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinCommunity } = useAuth();

  const handleJoinCommunity = async () => {
    if (!communityCode) {
      Alert.alert('Error', 'Please enter a community code');
      return;
    }

    try {
      setLoading(true);
      await joinCommunity(communityCode);
      Alert.alert('Success', 'Successfully joined community!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Community</Text>
      <Text style={styles.subtitle}>
        Enter your community code to access local services
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Community Code (e.g., SUN001)"
        value={communityCode}
        onChangeText={setCommunityCode}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleJoinCommunity}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Joining...' : 'Join Community'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default JoinCommunityScreen;