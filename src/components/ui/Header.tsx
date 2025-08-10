import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  showLogout = true,
}) => {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.leftSection}>
            {showBack && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            )}
            
            <View style={[styles.titleContainer, { marginLeft: showBack ? theme.spacing[3] : 0 }]}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>

          <View style={styles.rightSection}>
            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userRole}>{user.role}</Text>
              </View>
            )}
            
            {rightAction && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={rightAction.onPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={rightAction.icon}
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            )}
            
            {showLogout && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color={theme.colors.error[600]}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.white,
  },
  
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  
  titleContainer: {
    // marginLeft is handled inline in the component
  },
  
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  
  userInfo: {
    alignItems: 'flex-end',
  },
  
  userName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  
  userRole: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  
  iconButton: {
    padding: theme.spacing[2],
    borderRadius: theme.radius.full,
  },
  
  logoutButton: {
    padding: theme.spacing[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.error[50],
  },
});