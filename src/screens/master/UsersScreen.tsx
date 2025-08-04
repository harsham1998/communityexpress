import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { 
  UsersService, 
  User, 
  UserRole, 
  UserStatus, 
  CreateUserRequest, 
  UpdateUserRequest 
} from '../../services/users';
import { CommunitiesService, Community } from '../../services/communities';

const UsersScreen = ({ navigation }: any) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'resident' as UserRole,
    community_id: '',
    apartment_number: '',
  });

  const roleColors = {
    admin: theme.colors.error[600],
    resident: theme.colors.primary[600],
    vendor: theme.colors.secondary[600],
    security: theme.colors.warning[600],
  };

  const roleIcons = {
    admin: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    resident: 'person' as keyof typeof Ionicons.glyphMap,
    vendor: 'storefront' as keyof typeof Ionicons.glyphMap,
    security: 'lock-closed' as keyof typeof Ionicons.glyphMap,
  };

  const statusColors = {
    active: theme.colors.success[600],
    inactive: theme.colors.error[600],
    pending: theme.colors.warning[600],
  };

  useEffect(() => {
    loadUsers();
    loadCommunities();
  }, []);

  const loadUsers = async () => {
    try {
      let apiUsers: User[];
      
      if (selectedCommunity === 'all') {
        apiUsers = await UsersService.getAllUsers();
      } else {
        apiUsers = await UsersService.getUsersByCommunity(selectedCommunity);
      }
      
      setUsers(apiUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCommunities = async () => {
    try {
      const apiCommunities = await CommunitiesService.getAllCommunities();
      setCommunities(apiCommunities);
      
      // Set default community if user has one
      if (apiCommunities.length > 0 && !selectedCommunity) {
        setSelectedCommunity(currentUser?.communityId || apiCommunities[0].id);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [selectedCommunity]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.apartment_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'resident',
      community_id: communities.length > 0 ? communities[0].id : '',
      apartment_number: '',
    });
    setSelectedUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      role: user.role,
      community_id: user.community_id,
      apartment_number: user.apartment_number || '',
    });
    setSelectedUser(user);
    setShowAddModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedUser && !formData.password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    try {
      if (selectedUser) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          id: selectedUser.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: formData.role,
          apartment_number: formData.apartment_number,
        };
        await UsersService.updateUser(updateData);
        Alert.alert('Success', 'User updated successfully');
      } else {
        // Add new user
        const userData: CreateUserRequest = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: formData.role,
          community_id: formData.community_id,
          apartment_number: formData.apartment_number,
        };
        await UsersService.createUser(userData);
        Alert.alert('Success', 'User added successfully');
      }
      
      setShowAddModal(false);
      setShowRoleDropdown(false);
      setShowCommunityDropdown(false);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Failed to save user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      await UsersService.toggleUserStatus(user.id, newStatus);
      Alert.alert(
        'Success',
        `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      );
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.first_name} ${user.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await UsersService.deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
              loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const UserCard = React.memo(({ user }: { user: User }) => (
    <Card style={styles.userCard} padding={4}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>
                {user.first_name} {user.last_name}
              </Text>
              <View style={styles.roleAndStatus}>
                <View style={[
                  styles.roleBadge,
                  { backgroundColor: roleColors[user.role] + '20' }
                ]}>
                  <Ionicons
                    name={roleIcons[user.role]}
                    size={12}
                    color={roleColors[user.role]}
                    style={styles.badgeIcon}
                  />
                  <Text style={[
                    styles.roleText,
                    { color: roleColors[user.role] }
                  ]}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[user.status] + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: statusColors[user.status] }
                  ]}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.apartment_number && (
            <Text style={styles.apartmentNumber}>Apt: {user.apartment_number}</Text>
          )}
          <Text style={styles.communityName}>{user.community_name || 'Unknown Community'}</Text>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditUser(user)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(user)}
          >
            <Ionicons
              name={user.status === 'active' ? "pause-circle-outline" : "play-circle-outline"}
              size={20}
              color={user.status === 'active' ? theme.colors.warning[600] : theme.colors.success[600]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUser(user)}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error[600]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.userMetadata}>
        <Text style={styles.metadataText}>
          Joined: {formatDate(user.created_at)}
        </Text>
        {user.last_active && (
          <Text style={styles.metadataText}>
            Last active: {formatDate(user.last_active)}
          </Text>
        )}
        <View style={styles.verificationStatus}>
          <Ionicons
            name={user.is_verified ? "checkmark-circle" : "alert-circle"}
            size={16}
            color={user.is_verified ? theme.colors.success[600] : theme.colors.warning[600]}
          />
          <Text style={[
            styles.verificationText,
            { color: user.is_verified ? theme.colors.success[600] : theme.colors.warning[600] }
          ]}>
            {user.is_verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      </View>
    </Card>
  ));

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Users" 
          subtitle="Community user management"
          showLogout={true}
        />
        <View style={styles.loadingContainer}>
          <Text>Loading users...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Users" 
        subtitle={`${filteredUsers.length} users in selected community`}
        showLogout={true}
      />
      
      <View style={styles.content}>
        {/* Search and Add User */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.gray[400]}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <Card style={styles.filtersCard} padding={3}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersContainer}>
              {/* Community Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Community:</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    // Show community selector - for now just cycle through
                    const currentIndex = communities.findIndex(c => c.id === selectedCommunity);
                    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % (communities.length + 1);
                    
                    if (nextIndex === communities.length) {
                      setSelectedCommunity('all');
                    } else {
                      setSelectedCommunity(communities[nextIndex].id);
                    }
                    loadUsers();
                  }}
                >
                  <Text style={styles.filterButtonText}>
                    {selectedCommunity === 'all' 
                      ? 'All Communities' 
                      : communities.find(c => c.id === selectedCommunity)?.name || 'Unknown'
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Role Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Role:</Text>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterRole !== 'all' && styles.filterButtonActive
                  ]}
                  onPress={() => {
                    const roles: (UserRole | 'all')[] = ['all', 'admin', 'resident', 'vendor', 'security'];
                    const currentIndex = roles.indexOf(filterRole);
                    const nextIndex = (currentIndex + 1) % roles.length;
                    setFilterRole(roles[nextIndex]);
                  }}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterRole !== 'all' && styles.filterButtonTextActive
                  ]}>
                    {filterRole === 'all' ? 'All Roles' : filterRole.charAt(0).toUpperCase() + filterRole.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status:</Text>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus !== 'all' && styles.filterButtonActive
                  ]}
                  onPress={() => {
                    const statuses: (UserStatus | 'all')[] = ['all', 'active', 'inactive', 'pending'];
                    const currentIndex = statuses.indexOf(filterStatus);
                    const nextIndex = (currentIndex + 1) % statuses.length;
                    setFilterStatus(statuses[nextIndex]);
                  }}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterStatus !== 'all' && styles.filterButtonTextActive
                  ]}>
                    {filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Card>

        {/* Stats Summary */}
        <Card style={styles.summaryCard} padding={4}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{users.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{users.filter(u => u.status === 'active').length}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{users.filter(u => u.role === 'admin').length}</Text>
              <Text style={styles.summaryLabel}>Admins</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{users.filter(u => u.is_verified).length}</Text>
              <Text style={styles.summaryLabel}>Verified</Text>
            </View>
          </View>
        </Card>

        {/* Users List */}
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
          
          {filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first user to get started'
                }
              </Text>
            </View>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          setShowRoleDropdown(false);
          setShowCommunityDropdown(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              setShowRoleDropdown(false);
              setShowCommunityDropdown(false);
            }}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedUser ? 'Edit User' : 'Add User'}
            </Text>
            <TouchableOpacity onPress={handleSaveUser}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Input
              label="First Name *"
              placeholder="Enter first name"
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              leftIcon="person"
            />

            <Input
              label="Last Name *"
              placeholder="Enter last name"
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              leftIcon="person"
            />

            <Input
              label="Email *"
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
              editable={!selectedUser} // Don't allow email editing for existing users
            />

            {!selectedUser && (
              <Input
                label="Password *"
                placeholder="Enter password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                leftIcon="lock-closed"
              />
            )}

            <Input
              label="Phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              leftIcon="call"
            />

            <Input
              label="Apartment Number"
              placeholder="Enter apartment number"
              value={formData.apartment_number}
              onChangeText={(text) => setFormData({ ...formData, apartment_number: text })}
              leftIcon="home"
            />

            {/* Role Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                >
                  <View style={styles.dropdownContent}>
                    <Ionicons
                      name={roleIcons[formData.role]}
                      size={20}
                      color={roleColors[formData.role]}
                      style={styles.dropdownIcon}
                    />
                    <Text style={styles.dropdownText}>
                      {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                    </Text>
                  </View>
                  <Ionicons
                    name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.gray[400]}
                  />
                </TouchableOpacity>
                
                {showRoleDropdown && (
                  <ScrollView 
                    style={styles.dropdownOptions}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="always"
                  >
                    {(['admin', 'resident', 'vendor', 'security'] as UserRole[]).map(role => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.dropdownOption,
                          formData.role === role && styles.dropdownOptionSelected
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, role });
                          setShowRoleDropdown(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={roleIcons[role]}
                          size={20}
                          color={roleColors[role]}
                          style={styles.dropdownIcon}
                        />
                        <Text style={[
                          styles.dropdownOptionText,
                          formData.role === role && styles.dropdownOptionTextSelected
                        ]}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Community Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Community *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCommunityDropdown(!showCommunityDropdown)}
                >
                  <View style={styles.dropdownContent}>
                    <Ionicons
                      name="home-outline"
                      size={20}
                      color={theme.colors.primary[600]}
                      style={styles.dropdownIcon}
                    />
                    <Text style={styles.dropdownText}>
                      {communities.find(c => c.id === formData.community_id)?.name || 'Select Community'}
                    </Text>
                  </View>
                  <Ionicons
                    name={showCommunityDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.gray[400]}
                  />
                </TouchableOpacity>
                
                {showCommunityDropdown && (
                  <ScrollView 
                    style={styles.dropdownOptions}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="always"
                  >
                    {communities.map(community => (
                      <TouchableOpacity
                        key={community.id}
                        style={[
                          styles.dropdownOption,
                          formData.community_id === community.id && styles.dropdownOptionSelected
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, community_id: community.id });
                          setShowCommunityDropdown(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="home-outline"
                          size={20}
                          color={theme.colors.primary[600]}
                          style={styles.dropdownIcon}
                        />
                        <Text style={[
                          styles.dropdownOptionText,
                          formData.community_id === community.id && styles.dropdownOptionTextSelected
                        ]}>
                          {community.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </ScrollView>
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

  logoutButton: {
    padding: theme.spacing[2],
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
    gap: theme.spacing[3],
  },
  
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  searchIcon: {
    marginRight: theme.spacing[2],
  },
  
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  
  addButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  filtersCard: {
    marginBottom: theme.spacing[3],
  },
  
  filtersContainer: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },

  filterGroup: {
    alignItems: 'flex-start',
  },

  filterLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  filterButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  filterButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  
  summaryCard: {
    marginBottom: theme.spacing[4],
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  summaryItem: {
    alignItems: 'center',
  },
  
  summaryValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  
  summaryLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  
  list: {
    flex: 1,
  },
  
  userCard: {
    marginBottom: theme.spacing[3],
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  
  userInfo: {
    flex: 1,
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
    gap: theme.spacing[3],
  },
  
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  avatarText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },
  
  nameContainer: {
    flex: 1,
  },
  
  userName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  
  roleAndStatus: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
    gap: theme.spacing[1],
  },

  badgeIcon: {
    // Icon styling handled by parent
  },
  
  roleText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
  },
  
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  apartmentNumber: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing[1],
  },
  
  communityName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  cardActions: {
    flexDirection: 'row',
    gap: theme.spacing[1],
  },
  
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  userMetadata: {
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  metadataText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },

  verificationText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
  },
  
  emptySubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[2],
  },
  
  bottomSpacer: {
    height: theme.spacing[8],
  },
  
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
  
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  
  modalCancelButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  
  modalSaveButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  modalContent: {
    flex: 1,
    padding: theme.spacing[4],
  },
  
  inputGroup: {
    marginBottom: theme.spacing[4],
  },
  
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },

  // Custom dropdown styles (reused from VendorsScreen)
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 44,
  },

  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dropdownIcon: {
    marginRight: theme.spacing[3],
  },

  dropdownText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },

  dropdownOptions: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginTop: theme.spacing[1],
    maxHeight: 200,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  dropdownOptionSelected: {
    backgroundColor: theme.colors.primary[50],
  },

  dropdownOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },

  dropdownOptionTextSelected: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },
});

export default UsersScreen;