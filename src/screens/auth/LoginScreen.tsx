import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const fillMasterCredentials = () => {
    setEmail('master@communityexpress.com');
    setPassword('Master123!');
  };

  const fillVendorCredentials = () => {
    setEmail('testlaundry1754390780@vendor.example.com');
    setPassword('test');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.primary[600], theme.colors.primary[800]]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons 
                name="storefront" 
                size={48} 
                color={theme.colors.white}
              />
            </View>
            <Text style={styles.title}>CommunityExpress</Text>
            <Text style={styles.subtitle}>
              Your neighborhood marketplace
            </Text>
          </View>

          <Card style={styles.loginCard} padding={6}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>
              Sign in to your account to continue
            </Text>

            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="lock-closed"
              />

              <Button
                title={loading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
              />

              <TouchableOpacity 
                style={styles.masterButton}
                onPress={fillMasterCredentials}
              >
                <Ionicons 
                  name="key" 
                  size={16} 
                  color={theme.colors.primary[600]} 
                />
                <Text style={styles.masterButtonText}>
                  Use Master Credentials
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.vendorButton}
                onPress={fillVendorCredentials}
              >
                <Ionicons 
                  name="storefront" 
                  size={16} 
                  color={theme.colors.green[600]} 
                />
                <Text style={styles.vendorButtonText}>
                  Use Vendor Credentials (Test)
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.linkText}>
                Don't have an account? 
              </Text>
              <Text style={styles.linkTextBold}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  gradient: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  
  title: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  loginCard: {
    marginBottom: theme.spacing[6],
  },
  
  cardTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  
  cardSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  
  form: {
    gap: theme.spacing[1],
  },
  
  masterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
    marginTop: theme.spacing[4],
    gap: theme.spacing[2],
  },
  
  masterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  vendorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.green[50],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.green[200],
    marginTop: theme.spacing[2],
    gap: theme.spacing[2],
  },
  
  vendorButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.green[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  footer: {
    alignItems: 'center',
  },
  
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    gap: theme.spacing[1],
  },
  
  linkText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  linkTextBold: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold as any,
  },
});

export default LoginScreen;