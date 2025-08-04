import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VendorsService, Vendor, VendorType } from '../../services/vendors';

const UserVendorsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<VendorType | 'all'>('all');

  const vendorTypeColors = {
    milk: theme.colors.primary[600],
    laundry: theme.colors.secondary[600],
    food: theme.colors.warning[600],
    cleaning: theme.colors.success[600],
  };

  const vendorTypeIcons = {
    milk: 'cafe-outline' as keyof typeof Ionicons.glyphMap,
    laundry: 'shirt-outline' as keyof typeof Ionicons.glyphMap,
    food: 'restaurant-outline' as keyof typeof Ionicons.glyphMap,
    cleaning: 'sparkles-outline' as keyof typeof Ionicons.glyphMap,
  };

  const loadVendors = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (!user.communityId) {
      setVendors([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      const vendorsData = await VendorsService.getVendorsByCommunity(user.communityId);
      setVendors(vendorsData.filter(v => v.is_active));
    } catch (error) {
      setVendors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVendors();
  }, [loadVendors]);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || vendor.type === filterType;
    return matchesSearch && matchesType;
  });

  const VendorCard = React.memo(({ vendor }: { vendor: Vendor }) => (
    <TouchableOpacity 
      style={styles.vendorCard}
      onPress={() => navigation.navigate('VendorDetails', { vendorId: vendor.id })}
    >
      <View style={styles.vendorHeader}>
        <View style={[
          styles.vendorIcon,
          { backgroundColor: vendorTypeColors[vendor.type] + '20' }
        ]}>
          <Ionicons
            name={vendorTypeIcons[vendor.type]}
            size={24}
            color={vendorTypeColors[vendor.type]}
          />
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <Text style={styles.vendorType}>
            {vendor.type.charAt(0).toUpperCase() + vendor.type.slice(1)}
          </Text>
          <View style={styles.vendorStats}>
            <View style={styles.vendorStat}>
              <Ionicons name="star" size={14} color={theme.colors.warning[500]} />
              <Text style={styles.vendorStatText}>{(vendor.rating || 0).toFixed(1)}</Text>
            </View>
            <Text style={styles.vendorStatDot}>"</Text>
            <Text style={styles.vendorStatText}>{vendor.total_orders || 0} orders</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
      </View>
      
      <Text style={styles.vendorDescription} numberOfLines={2}>
        {vendor.description}
      </Text>
      
      <Text style={styles.vendorAddress}>{vendor.address}</Text>
    </TouchableOpacity>
  ));

  if (loading && vendors.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Vendors" subtitle="Browse local vendors" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading vendors...</Text>
        </View>
      </View>
    );
  }

  
  return (
    <View style={styles.container}>
      <Header 
        title="Vendors" 
        subtitle={`${filteredVendors.length} vendors available`}
      />
      
      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.gray[400]}
          />
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
            <Card style={styles.emptyCard} padding={6}>
              <View style={styles.emptyContainer}>
                <Ionicons name="storefront-outline" size={64} color={theme.colors.gray[400]} />
                <Text style={styles.emptyText}>
                  {searchQuery || filterType !== 'all' 
                    ? 'No vendors match your search' 
                    : 'No vendors available'
                  }
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Check back later for new vendors'
                  }
                </Text>
              </View>
            </Card>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
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
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing[3],
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
    // Styling handled by parent
  },
  
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  
  list: {
    flex: 1,
  },
  
  vendorCard: {
    marginBottom: theme.spacing[3],
  },
  
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  
  vendorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  
  vendorInfo: {
    flex: 1,
  },
  
  vendorName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  
  vendorType: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  
  vendorStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  vendorStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing[1],
  },
  
  vendorStatText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },

  vendorStatDot: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing[1],
  },
  
  vendorDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing[2],
    marginLeft: 60, // Align with vendor info
  },
  
  vendorAddress: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    marginLeft: 60, // Align with vendor info
  },
  
  emptyCard: {
    marginTop: theme.spacing[8],
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    textAlign: 'center',
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
});

export default UserVendorsScreen;