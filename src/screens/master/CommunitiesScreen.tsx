import React, { useState, useEffect } from 'react';
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
  CommunitiesService, 
  Community as ApiCommunity, 
  CreateCommunityRequest, 
  UpdateCommunityRequest 
} from '../../services/communities';

interface Community {
  id: string;
  name: string;
  address: string;
  communityCode: string;
  totalResidents: number;
  totalVendors: number;
  totalOrders: number;
  monthlyRevenue: number;
  isActive: boolean;
  createdAt: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

const CommunitiesScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  useEffect(() => {
    // Only load communities when auth is complete and user is available
    if (!authLoading && user) {
      console.log('👤 User authenticated, loading communities...');
      loadCommunities();
    } else if (!authLoading && !user) {
      console.log('❌ No authenticated user found');
      setLoading(false);
    }
  }, [authLoading, user]);

  const loadCommunities = async () => {
    try {
      const apiCommunities = await CommunitiesService.getAllCommunities();
      
      // Transform API data to match our UI interface
      const transformedCommunities: Community[] = apiCommunities.map(apiCommunity => ({
        id: apiCommunity.id,
        name: apiCommunity.name,
        address: apiCommunity.address,
        communityCode: apiCommunity.community_code,
        totalResidents: 0, // Will be populated from stats
        totalVendors: 0, // Will be populated from stats
        totalOrders: 0, // Will be populated from stats
        monthlyRevenue: 0, // Will be populated from stats
        isActive: apiCommunity.is_active,
        createdAt: apiCommunity.created_at,
        adminName: apiCommunity.admin_name,
        adminEmail: apiCommunity.admin_email,
        adminPhone: apiCommunity.admin_phone,
      }));

      setCommunities(transformedCommunities);
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCommunities();
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.communityCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCommunity = () => {
    setFormData({
      name: '',
      address: '',
      adminName: '',
      adminEmail: '',
      adminPhone: '',
    });
    setSelectedCommunity(null);
    setShowAddModal(true);
  };

  const handleEditCommunity = (community: Community) => {
    setFormData({
      name: community.name,
      address: community.address,
      adminName: community.adminName,
      adminEmail: community.adminEmail,
      adminPhone: community.adminPhone,
    });
    setSelectedCommunity(community);
    setShowAddModal(true);
  };

  const handleSaveCommunity = async () => {
    if (!formData.name || !formData.address || !formData.adminName || !formData.adminEmail) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const communityData = {
        name: formData.name,
        address: formData.address,
        admin_name: formData.adminName,
        admin_email: formData.adminEmail,
        admin_phone: formData.adminPhone,
      };

      if (selectedCommunity) {
        // Update existing community
        const updateData: UpdateCommunityRequest = {
          id: selectedCommunity.id,
          ...communityData,
        };
        await CommunitiesService.updateCommunity(updateData);
        Alert.alert('Success', 'Community updated successfully');
      } else {
        // Add new community
        await CommunitiesService.createCommunity(communityData);
        Alert.alert('Success', 'Community added successfully');
      }
      
      setShowAddModal(false);
      loadCommunities(); // Reload the list
    } catch (error) {
      console.error('Error saving community:', error);
      Alert.alert('Error', 'Failed to save community');
    }
  };

  const handleToggleStatus = async (community: Community) => {
    try {
      const newStatus = !community.isActive;
      await CommunitiesService.toggleCommunityStatus(community.id, newStatus);
      
      Alert.alert(
        'Success',
        `Community ${community.isActive ? 'deactivated' : 'activated'} successfully`
      );
      
      loadCommunities(); // Reload the list
    } catch (error) {
      console.error('Error toggling community status:', error);
      Alert.alert('Error', 'Failed to update community status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const CommunityCard = ({ community }: { community: Community }) => (
    <Card style={styles.communityCard} padding={4}>
      <View style={styles.cardHeader}>
        <View style={styles.communityInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.communityName}>{community.name}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: community.isActive ? theme.colors.success[100] : theme.colors.error[100] }
            ]}>
              <Text style={[
                styles.statusText,
                { color: community.isActive ? theme.colors.success[600] : theme.colors.error[600] }
              ]}>
                {community.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Text style={styles.communityCode}>Code: {community.communityCode}</Text>
          <Text style={styles.communityAddress}>{community.address}</Text>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditCommunity(community)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(community)}
          >
            <Ionicons
              name={community.isActive ? "pause-circle-outline" : "play-circle-outline"}
              size={20}
              color={community.isActive ? theme.colors.warning[600] : theme.colors.success[600]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{community.totalResidents}</Text>
          <Text style={styles.statLabel}>Residents</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{community.totalVendors}</Text>
          <Text style={styles.statLabel}>Vendors</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{community.totalOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(community.monthlyRevenue)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.adminInfo}>
        <Text style={styles.adminLabel}>Admin: {community.adminName}</Text>
        <Text style={styles.adminContact}>{community.adminEmail}</Text>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Communities" subtitle="Manage residential communities" />
        <View style={styles.loadingContainer}>
          <Text>Loading communities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Communities" subtitle="Manage residential communities" />
      
      <View style={styles.content}>
        {/* Search and Add */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search communities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.gray[400]}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCommunity}>
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <Card style={styles.summaryCard} padding={4}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{communities.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{communities.filter(c => c.isActive).length}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {communities.reduce((sum, c) => sum + c.totalResidents, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Residents</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatCurrency(communities.reduce((sum, c) => sum + c.monthlyRevenue, 0))}
              </Text>
              <Text style={styles.summaryLabel}>Revenue</Text>
            </View>
          </View>
        </Card>

        {/* Communities List */}
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredCommunities.map(community => (
            <CommunityCard key={community.id} community={community} />
          ))}
          
          {filteredCommunities.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyText}>No communities found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Add your first community to get started'}
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
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedCommunity ? 'Edit Community' : 'Add Community'}
            </Text>
            <TouchableOpacity onPress={handleSaveCommunity}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Input
              label="Community Name *"
              placeholder="Enter community name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              leftIcon="business"
            />

            <Input
              label="Address *"
              placeholder="Enter full address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              leftIcon="location"
              multiline
            />

            <Input
              label="Admin Name *"
              placeholder="Enter admin full name"
              value={formData.adminName}
              onChangeText={(text) => setFormData({ ...formData, adminName: text })}
              leftIcon="person"
            />

            <Input
              label="Admin Email *"
              placeholder="Enter admin email"
              value={formData.adminEmail}
              onChangeText={(text) => setFormData({ ...formData, adminEmail: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
            />

            <Input
              label="Admin Phone"
              placeholder="Enter admin phone number"
              value={formData.adminPhone}
              onChangeText={(text) => setFormData({ ...formData, adminPhone: text })}
              keyboardType="phone-pad"
              leftIcon="call"
            />
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
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
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
  
  communityCard: {
    marginBottom: theme.spacing[3],
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  
  communityInfo: {
    flex: 1,
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
    gap: theme.spacing[2],
  },
  
  communityName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
  },
  
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  communityCode: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing[1],
  },
  
  communityAddress: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
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
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginBottom: theme.spacing[3],
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  
  adminInfo: {
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  
  adminLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  
  adminContact: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
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
});

export default CommunitiesScreen;