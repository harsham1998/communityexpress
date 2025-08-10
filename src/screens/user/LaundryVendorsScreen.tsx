import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { LaundryService, LaundryVendor } from '../../services/laundry';

const LaundryVendorsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<LaundryVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const vendorsData = await LaundryService.getAllLaundryVendors(user?.communityId);
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error loading laundry vendors:', error);
      Alert.alert('Error', 'Failed to load laundry vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const VendorCard = ({ vendor }: { vendor: LaundryVendor }) => (
    <Card style={styles.vendorCard} padding={4}>
      <TouchableOpacity
        onPress={() => navigation.navigate('LaundryVendorDetails', { vendor })}
        style={styles.vendorContent}
      >
        <View style={styles.vendorHeader}>
          <View style={styles.vendorIcon}>
            <Ionicons name="shirt-outline" size={24} color={theme.colors.primary[600]} />
          </View>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.business_name}</Text>
            <Text style={styles.vendorDescription} numberOfLines={2}>
              {vendor.description || 'Professional laundry service'}
            </Text>
          </View>
          <View style={styles.vendorStatus}>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.success[100] }]}>
              <Text style={[styles.statusText, { color: theme.colors.success[700] }]}>
                Open
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.vendorDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.gray[500]} />
            <Text style={styles.detailText}>
              {formatTime(vendor.pickup_time_start)} - {formatTime(vendor.pickup_time_end)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={16} color={theme.colors.gray[500]} />
            <Text style={styles.detailText}>
              Delivery in {vendor.delivery_time_hours}h
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={16} color={theme.colors.gray[500]} />
            <Text style={styles.detailText}>
              Min. order ₹{vendor.minimum_order_amount}
            </Text>
          </View>
        </View>

        <View style={styles.vendorPricing}>
          <View style={styles.pricingItem}>
            <Text style={styles.pricingLabel}>Pickup</Text>
            <Text style={styles.pricingValue}>
              {vendor.pickup_charge > 0 ? `₹${vendor.pickup_charge}` : 'Free'}
            </Text>
          </View>
          <View style={styles.pricingItem}>
            <Text style={styles.pricingLabel}>Delivery</Text>
            <Text style={styles.pricingValue}>
              {vendor.delivery_charge > 0 ? `₹${vendor.delivery_charge}` : 'Free'}
            </Text>
          </View>
        </View>

        <View style={styles.vendorActions}>
          <TouchableOpacity
            style={styles.viewMenuButton}
            onPress={() => navigation.navigate('LaundryVendorDetails', { vendor })}
          >
            <Text style={styles.viewMenuText}>View Services</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Laundry Services" subtitle="Find laundry vendors" />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Laundry Services" subtitle="Find laundry vendors in your community" />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {vendors.length === 0 ? (
          <Card style={styles.emptyCard} padding={6}>
            <View style={styles.emptyContent}>
              <Ionicons name="shirt-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Laundry Services</Text>
              <Text style={styles.emptySubtitle}>
                No laundry vendors are available in your community yet.
              </Text>
            </View>
          </Card>
        ) : (
          <>
            <View style={styles.headerSection}>
              <Text style={styles.sectionTitle}>Available Services</Text>
              <Text style={styles.sectionSubtitle}>
                {vendors.length} laundry service{vendors.length !== 1 ? 's' : ''} found
              </Text>
            </View>

            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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

  headerSection: {
    marginBottom: theme.spacing[4],
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  vendorCard: {
    marginBottom: theme.spacing[4],
  },

  vendorContent: {
    flex: 1,
  },

  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },

  vendorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[100],
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

  vendorDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },

  vendorStatus: {
    alignItems: 'flex-end',
  },

  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.sm,
  },

  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  vendorDetails: {
    marginBottom: theme.spacing[3],
    gap: theme.spacing[2],
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },

  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  vendorPricing: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    gap: theme.spacing[4],
  },

  pricingItem: {
    flex: 1,
    alignItems: 'center',
  },

  pricingLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  pricingValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  vendorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  viewMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.radius.md,
    gap: theme.spacing[1],
  },

  viewMenuText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.primary[600],
  },

  emptyCard: {
    marginTop: theme.spacing[8],
  },

  emptyContent: {
    alignItems: 'center',
    textAlign: 'center',
  },

  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },

  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  bottomSpacer: {
    height: theme.spacing[8],
  },
});

export default LaundryVendorsScreen;