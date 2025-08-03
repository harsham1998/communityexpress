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
import { Picker } from '@react-native-picker/picker';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { theme } from '../../theme';
import { 
  VendorsService, 
  Vendor as ApiVendor, 
  VendorType, 
  CreateVendorRequest, 
  UpdateVendorRequest 
} from '../../services/vendors';

interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  email: string;
  phone: string;
  address: string;
  communityId: string;
  communityName: string;
  isActive: boolean;
  rating: number;
  totalOrders: number;
  monthlyRevenue: number;
  description: string;
  createdAt: string;
  lastActive: string;
}

const VendorsScreen = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<VendorType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'food' as VendorType,
    email: '',
    phone: '',
    address: '',
    communityId: '1',
    description: '',
  });

  const vendorTypeColors = {
    milk: theme.colors.blue[600],
    laundry: theme.colors.purple[600],
    food: theme.colors.orange[600],
    cleaning: theme.colors.green[600],
  };

  const vendorTypeIcons = {
    milk: 'cafe-outline' as keyof typeof Ionicons.glyphMap,
    laundry: 'shirt-outline' as keyof typeof Ionicons.glyphMap,
    food: 'restaurant-outline' as keyof typeof Ionicons.glyphMap,
    cleaning: 'sparkles-outline' as keyof typeof Ionicons.glyphMap,
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const apiVendors = await VendorsService.getAllVendors();
      
      // Transform API data to match our UI interface
      const transformedVendors: Vendor[] = apiVendors.map(apiVendor => ({
        id: apiVendor.id,
        name: apiVendor.name,
        type: apiVendor.type,
        email: apiVendor.email,
        phone: apiVendor.phone,
        address: apiVendor.address,
        communityId: apiVendor.community_id,
        communityName: apiVendor.community_name || 'Unknown',
        isActive: apiVendor.is_active,
        rating: apiVendor.rating,
        totalOrders: apiVendor.total_orders,
        monthlyRevenue: apiVendor.monthly_revenue,
        description: apiVendor.description,
        createdAt: apiVendor.created_at,
        lastActive: apiVendor.last_active,
      }));

      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
      Alert.alert('Error', 'Failed to load vendors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVendors();
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.communityName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || vendor.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleAddVendor = () => {
    setFormData({
      name: '',
      type: 'food',
      email: '',
      phone: '',
      address: '',
      communityId: '1',
      description: '',
    });
    setSelectedVendor(null);
    setShowAddModal(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      type: vendor.type,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      communityId: vendor.communityId,
      description: vendor.description,
    });
    setSelectedVendor(vendor);
    setShowAddModal(true);
  };

  const handleSaveVendor = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const vendorData = {
        name: formData.name,
        type: formData.type,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        community_id: formData.communityId,
        description: formData.description,
      };

      if (selectedVendor) {
        // Update existing vendor
        const updateData: UpdateVendorRequest = {
          id: selectedVendor.id,
          ...vendorData,
        };
        await VendorsService.updateVendor(updateData);
        Alert.alert('Success', 'Vendor updated successfully');
      } else {
        // Add new vendor
        await VendorsService.createVendor(vendorData);
        Alert.alert('Success', 'Vendor added successfully');
      }
      
      setShowAddModal(false);
      loadVendors(); // Reload the list
    } catch (error) {
      console.error('Error saving vendor:', error);
      Alert.alert('Error', 'Failed to save vendor');
    }
  };

  const handleToggleStatus = async (vendor: Vendor) => {
    try {
      const newStatus = !vendor.isActive;
      await VendorsService.toggleVendorStatus(vendor.id, newStatus);
      
      Alert.alert(
        'Success',
        `Vendor ${vendor.isActive ? 'deactivated' : 'activated'} successfully`
      );
      
      loadVendors(); // Reload the list
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      Alert.alert('Error', 'Failed to update vendor status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const VendorCard = ({ vendor }: { vendor: Vendor }) => (
    <Card style={styles.vendorCard} padding={4}>
      <View style={styles.cardHeader}>
        <View style={styles.vendorInfo}>
          <View style={styles.nameRow}>
            <View style={styles.vendorIcon}>
              <Ionicons
                name={vendorTypeIcons[vendor.type]}
                size={24}
                color={vendorTypeColors[vendor.type]}
              />
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              <View style={styles.typeAndStatus}>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: vendorTypeColors[vendor.type] + '20' }
                ]}>
                  <Text style={[
                    styles.typeText,
                    { color: vendorTypeColors[vendor.type] }
                  ]}>
                    {vendor.type.charAt(0).toUpperCase() + vendor.type.slice(1)}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: vendor.isActive ? theme.colors.success[100] : theme.colors.error[100] }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: vendor.isActive ? theme.colors.success[600] : theme.colors.error[600] }
                  ]}>
                    {vendor.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.communityName}>{vendor.communityName}</Text>
          <Text style={styles.vendorDescription}>{vendor.description}</Text>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditVendor(vendor)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(vendor)}
          >
            <Ionicons
              name={vendor.isActive ? "pause-circle-outline" : "play-circle-outline"}
              size={20}
              color={vendor.isActive ? theme.colors.warning[600] : theme.colors.success[600]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vendor.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vendor.totalOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(vendor.monthlyRevenue)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactLabel}>Contact: {vendor.email}</Text>
        <Text style={styles.contactPhone}>{vendor.phone}</Text>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Vendors" subtitle="Manage all vendors" />
        <View style={styles.loadingContainer}>
          <Text>Loading vendors...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Vendors" subtitle="Manage all vendors" />
      
      <View style={styles.content}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.gray[400]}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddVendor}>
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Type Filter */}
        <Card style={styles.filterCard} padding={3}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterType === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterType === 'all' && styles.filterButtonTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {(['milk', 'food', 'laundry', 'cleaning'] as VendorType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    filterType === type && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Ionicons
                    name={vendorTypeIcons[type]}
                    size={16}
                    color={filterType === type ? theme.colors.white : vendorTypeColors[type]}
                    style={styles.filterIcon}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    filterType === type && styles.filterButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Stats Summary */}
        <Card style={styles.summaryCard} padding={4}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{vendors.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{vendors.filter(v => v.isActive).length}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {(vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)}
              </Text>
              <Text style={styles.summaryLabel}>Avg Rating</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatCurrency(vendors.reduce((sum, v) => sum + v.monthlyRevenue, 0))}
              </Text>
              <Text style={styles.summaryLabel}>Revenue</Text>
            </View>
          </View>
        </Card>

        {/* Vendors List */}
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredVendors.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
          
          {filteredVendors.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyText}>No vendors found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Add your first vendor to get started'}
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
              {selectedVendor ? 'Edit Vendor' : 'Add Vendor'}
            </Text>
            <TouchableOpacity onPress={handleSaveVendor}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Input
              label="Vendor Name *"
              placeholder="Enter vendor name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              leftIcon="storefront"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vendor Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Food Delivery" value="food" />
                  <Picker.Item label="Milk Delivery" value="milk" />
                  <Picker.Item label="Laundry Service" value="laundry" />
                  <Picker.Item label="Cleaning Service" value="cleaning" />
                </Picker>
              </View>
            </View>

            <Input
              label="Email *"
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
            />

            <Input
              label="Phone *"
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              leftIcon="call"
            />

            <Input
              label="Address *"
              placeholder="Enter business address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              leftIcon="location"
              multiline
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Community *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.communityId}
                  onValueChange={(value) => setFormData({ ...formData, communityId: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Sunrise Apartments" value="1" />
                  <Picker.Item label="Green Valley" value="2" />
                  <Picker.Item label="Ocean View" value="3" />
                  <Picker.Item label="Mountain Ridge" value="4" />
                  <Picker.Item label="City Center Plaza" value="5" />
                </Picker>
              </View>
            </View>

            <Input
              label="Description"
              placeholder="Enter vendor description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              leftIcon="document-text"
              multiline
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
  
  filterCard: {
    marginBottom: theme.spacing[3],
  },
  
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing[1],
  },
  
  filterButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  
  filterIcon: {
    // No additional styles needed
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
  
  vendorCard: {
    marginBottom: theme.spacing[3],
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  
  vendorInfo: {
    flex: 1,
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
    gap: theme.spacing[3],
  },
  
  vendorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  nameContainer: {
    flex: 1,
  },
  
  vendorName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  
  typeAndStatus: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  
  typeBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
  },
  
  typeText: {
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
  
  communityName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing[1],
  },
  
  vendorDescription: {
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
    justifyContent: 'space-around',
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
  
  contactInfo: {
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  
  contactLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  
  contactPhone: {
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
  
  inputGroup: {
    marginBottom: theme.spacing[4],
  },
  
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  
  pickerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  picker: {
    height: 44,
  },
});

export default VendorsScreen;