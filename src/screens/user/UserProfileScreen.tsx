import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { CommunitiesService, Community } from '../../services/communities';
import ApiService from '../../services/api';

const UserProfileScreen = ({ navigation }: any) => {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [apartmentNumber, setApartmentNumber] = useState(user?.apartmentNumber || '');

  useEffect(() => {
    loadCommunityData();
    loadAllCommunities();
  }, [user]);

  useEffect(() => {
    setApartmentNumber(user?.apartmentNumber || '');
  }, [user?.apartmentNumber]);

  const loadCommunityData = async () => {
    if (!user?.communityId) {
      setCommunity(null);
      return;
    }

    try {
      const communityData = await CommunitiesService.getCommunityById(user.communityId);
      setCommunity(communityData);
    } catch (error) {
      setCommunity(null);
    }
  };

  const loadAllCommunities = async () => {
    try {
      const allCommunities = await CommunitiesService.getAllCommunities();
      setCommunities(allCommunities.filter(c => c.is_active));
    } catch (error) {
      console.error('Error loading communities:', error);
      setCommunities([]);
    }
  };

  const handleCommunitySelect = async (selectedCommunity: Community) => {
    try {
      setLoading(true);
      
      // Update user community via API
      const response = await ApiService.updateUserCommunity(selectedCommunity.id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update local state and refresh user data
      setCommunity(selectedCommunity);
      setShowCommunityModal(false);
      await refreshUser(); // Refresh user data from server
      
      Alert.alert('Success', 'Community updated successfully! The changes will be reflected across the app.');
      
    } catch (error) {
      console.error('Error updating community:', error);
      Alert.alert('Error', 'Failed to update community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApartmentUpdate = async () => {
    try {
      setLoading(true);
      
      // Update user apartment via API
      const response = await ApiService.updateUserApartment(apartmentNumber);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setShowApartmentModal(false);
      await refreshUser(); // Refresh user data from server
      Alert.alert('Success', 'Apartment number updated successfully! The changes will be reflected across the app.');
      
    } catch (error) {
      console.error('Error updating apartment:', error);
      Alert.alert('Error', 'Failed to update apartment number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Try to logout via API, but don't block if it fails
              try {
                await ApiService.logout();
              } catch (apiError) {
                console.error('API logout failed:', apiError);
                // Continue with local logout even if API fails
              }
              logout();
            } catch (error) {
              console.error('Error during logout:', error);
              // Still logout locally even if everything fails
              logout();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const ProfileItem = ({ 
    icon, 
    title, 
    value, 
    onPress 
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    title: string; 
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemContent}>
        <View style={styles.profileItemLeft}>
          <View style={styles.profileItemIcon}>
            <Ionicons name={icon} size={20} color={theme.colors.primary[600]} />
          </View>
          <View style={styles.profileItemText}>
            <Text style={styles.profileItemTitle}>{title}</Text>
            {value && <Text style={styles.profileItemValue}>{value}</Text>}
          </View>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
        )}
      </View>
    </TouchableOpacity>
  );

  const ActionButton = ({ 
    icon, 
    title, 
    subtitle, 
    color, 
    onPress 
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    title: string; 
    subtitle: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Header title="Profile" subtitle="Account information" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Profile" 
        subtitle="Manage your account"
        showLogout={true}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card style={styles.profileCard} padding={5}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              {user.apartmentNumber && (
                <Text style={styles.profileApartment}>
                  Apartment {user.apartmentNumber}
                </Text>
              )}
              <View style={styles.verificationBadge}>
                <Ionicons
                  name={user.isActive ? "checkmark-circle" : "alert-circle"}
                  size={16}
                  color={user.isActive ? theme.colors.success[600] : theme.colors.warning[600]}
                />
                <Text style={[
                  styles.verificationText,
                  { color: user.isActive ? theme.colors.success[600] : theme.colors.warning[600] }
                ]}>
                  {user.isActive ? 'Active Account' : 'Inactive Account'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Personal Information */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <ProfileItem
            icon="person-outline"
            title="Full Name"
            value={`${user.firstName} ${user.lastName}`}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ProfileItem
            icon="mail-outline"
            title="Email Address"
            value={user.email}
          />
          <ProfileItem
            icon="call-outline"
            title="Phone Number"
            value={user.phone || 'Not provided'}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ProfileItem
            icon="home-outline"
            title="Community"
            value={community ? `${community.name} (${community.community_code})` : 'Loading...'}
            onPress={() => setShowCommunityModal(true)}
          />
          <ProfileItem
            icon="business-outline"
            title="Apartment"
            value={apartmentNumber || 'Not provided'}
            onPress={() => setShowApartmentModal(true)}
          />
        </Card>

        {/* Quick Actions */}
        <Card style={styles.sectionCard} padding={4}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ActionButton
            icon="receipt-outline"
            title="Order History"
            subtitle="View your past orders"
            color={theme.colors.primary[600]}
            onPress={() => navigation.navigate('OrderHistory')}
          />
          <ActionButton
            icon="storefront-outline"
            title="Browse Vendors"
            subtitle="Find vendors in your community"
            color={theme.colors.secondary[600]}
            onPress={() => navigation.navigate('UserVendors')}
          />
          <ActionButton
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage your notification preferences"
            color={theme.colors.warning[600]}
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <ActionButton
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with your account"
            color={theme.colors.success[600]}
            onPress={() => navigation.navigate('Support')}
          />
        </Card>

        {/* Account Settings */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
          </View>
          <ProfileItem
            icon="create-outline"
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ProfileItem
            icon="lock-closed-outline"
            title="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <ProfileItem
            icon="shield-checkmark-outline"
            title="Privacy Settings"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
          <ProfileItem
            icon="card-outline"
            title="Payment Methods"
            onPress={() => navigation.navigate('PaymentMethods')}
          />
        </Card>

        {/* App Information */}
        <Card style={styles.sectionCard} padding={0}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>App Information</Text>
          </View>
          <ProfileItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <ProfileItem
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <ProfileItem
            icon="information-circle-outline"
            title="About"
            onPress={() => navigation.navigate('About')}
          />
          <ProfileItem
            icon="star-outline"
            title="Rate App"
            onPress={() => {
              Alert.alert('Rate App', 'Thank you for using CommunityExpress!');
            }}
          />
        </Card>

        {/* Logout Button */}
        <Card style={styles.logoutCard} padding={4}>
          <TouchableOpacity 
            style={styles.logoutButtonLarge} 
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons 
              name="log-out-outline" 
              size={20} 
              color={theme.colors.error[600]} 
              style={styles.logoutIcon}
            />
            <Text style={styles.logoutText}>
              {loading ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Community Selection Modal */}
      <Modal
        visible={showCommunityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommunityModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCommunityModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Community</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {communities.map(comm => (
              <TouchableOpacity
                key={comm.id}
                style={[
                  styles.communityOption,
                  community?.id === comm.id && styles.communityOptionSelected
                ]}
                onPress={() => handleCommunitySelect(comm)}
                disabled={loading}
              >
                <View style={styles.communityOptionContent}>
                  <View style={styles.communityOptionLeft}>
                    <View style={[
                      styles.communityOptionIcon,
                      { backgroundColor: community?.id === comm.id ? theme.colors.primary[600] : theme.colors.primary[100] }
                    ]}>
                      <Ionicons
                        name="home"
                        size={20}
                        color={community?.id === comm.id ? theme.colors.white : theme.colors.primary[600]}
                      />
                    </View>
                    <View style={styles.communityOptionText}>
                      <Text style={[
                        styles.communityOptionTitle,
                        community?.id === comm.id && styles.communityOptionTitleSelected
                      ]}>
                        {comm.name}
                      </Text>
                      <Text style={styles.communityOptionCode}>{comm.community_code}</Text>
                      {comm.address && (
                        <Text style={styles.communityOptionAddress}>{comm.address}</Text>
                      )}
                    </View>
                  </View>
                  {community?.id === comm.id && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[600]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Apartment Number Modal */}
      <Modal
        visible={showApartmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApartmentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowApartmentModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Apartment Number</Text>
            <TouchableOpacity onPress={handleApartmentUpdate} disabled={loading}>
              <Text style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apartment Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your apartment number"
                value={apartmentNumber}
                onChangeText={setApartmentNumber}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleApartmentUpdate}
              />
              <Text style={styles.inputHint}>
                Enter your apartment/flat number (e.g., A-101, 2B, 405)
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  content: {
    flex: 1,
    padding: theme.spacing[4],
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  logoutButton: {
    padding: theme.spacing[2],
  },

  profileCard: {
    marginBottom: theme.spacing[4],
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },

  avatarText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  profileEmail: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  profileApartment: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing[2],
  },

  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },

  verificationText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  sectionCard: {
    marginBottom: theme.spacing[4],
  },

  sectionHeader: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  profileItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },

  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },

  profileItemText: {
    flex: 1,
  },

  profileItemTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  profileItemValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[2],
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  actionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  logoutCard: {
    marginBottom: theme.spacing[4],
  },

  logoutButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.error[50],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error[200],
  },

  logoutIcon: {
    marginRight: theme.spacing[2],
  },

  logoutText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.error[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  bottomSpacer: {
    height: theme.spacing[8],
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  modalHeaderSpacer: {
    width: 60, // Same width as buttons for centering
  },

  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  modalCancelButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },

  modalSaveButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },

  modalSaveButtonDisabled: {
    color: theme.colors.text.tertiary,
  },

  modalContent: {
    flex: 1,
    padding: theme.spacing[4],
  },

  // Community option styles
  communityOption: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },

  communityOptionSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },

  communityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[4],
  },

  communityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  communityOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },

  communityOptionText: {
    flex: 1,
  },

  communityOptionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  communityOptionTitleSelected: {
    color: theme.colors.primary[600],
  },

  communityOptionCode: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing[1],
  },

  communityOptionAddress: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },

  // Input styles
  inputGroup: {
    marginBottom: theme.spacing[4],
  },

  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },

  textInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 48,
  },

  inputHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    lineHeight: 16,
  },
});

export default UserProfileScreen;