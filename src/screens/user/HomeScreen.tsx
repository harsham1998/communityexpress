import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VendorsService, Vendor } from '../../services/vendors';
import { OrdersService, Order } from '../../services/orders';
import { CommunitiesService, Community } from '../../services/communities';


const UserHomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (!user.communityId) {
      setVendors([]);
      setRecentOrders([]);
      setCommunity(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Load community information
      try {
        const communityData = await CommunitiesService.getCommunityById(user.communityId);
        setCommunity(communityData);
      } catch (communityError) {
        setCommunity(null);
      }
      
      // Load vendors for user's community
      try {
        const vendorsData = await VendorsService.getVendorsByCommunity(user.communityId);
        setVendors(vendorsData.filter(v => v.is_active).slice(0, 6)); // Top 6 active vendors
      } catch (vendorError) {
        setVendors([]);
      }
      
      // Load recent orders
      try {
        const ordersData = await OrdersService.getUserOrders();
        setRecentOrders(ordersData.slice(0, 3)); // Last 3 orders
      } catch (orderError) {
        setRecentOrders([]);
      }
      
    } catch (error) {
      // Handle silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, [loadHomeData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return theme.colors.success[600];
      case 'out_for_delivery': return theme.colors.primary[600];
      case 'preparing': return theme.colors.warning[600];
      case 'cancelled': return theme.colors.error[600];
      default: return theme.colors.gray[500];
    }
  };

  const getVendorTypeIcon = (type: string) => {
    switch (type) {
      case 'food': return 'restaurant';
      case 'milk': return 'cafe';
      case 'laundry': return 'shirt';
      case 'cleaning': return 'sparkles';
      default: return 'storefront';
    }
  };

  const QuickActionCard = ({ 
    title, 
    icon, 
    color, 
    onPress 
  }: { 
    title: string; 
    icon: keyof typeof Ionicons.glyphMap; 
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const VendorCard = React.memo(({ vendor }: { vendor: Vendor }) => (
    <TouchableOpacity 
      style={styles.vendorCard} 
      onPress={() => navigation.navigate('VendorDetails', { vendorId: vendor.id })}
    >
      <View style={styles.vendorHeader}>
        <View style={[
          styles.vendorIcon, 
          { backgroundColor: theme.colors.primary[100] }
        ]}>
          <Ionicons 
            name={getVendorTypeIcon(vendor.type) as keyof typeof Ionicons.glyphMap} 
            size={20} 
            color={theme.colors.primary[600]} 
          />
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
          <Text style={styles.vendorType}>
            {vendor.type.charAt(0).toUpperCase() + vendor.type.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.vendorStats}>
        <View style={styles.vendorStat}>
          <Ionicons name="star" size={14} color={theme.colors.warning[500]} />
          <Text style={styles.vendorStatText}>{(vendor.rating || 0).toFixed(1)}</Text>
        </View>
        <Text style={styles.vendorStatText}>•</Text>
        <Text style={styles.vendorStatText}>{vendor.total_orders || 0} orders</Text>
      </View>
    </TouchableOpacity>
  ));

  const OrderCard = React.memo(({ order }: { order: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderVendor}>{order.vendor_name}</Text>
        <View style={[
          styles.orderStatusBadge,
          { backgroundColor: getOrderStatusColor(order.status) + '20' }
        ]}>
          <Text style={[
            styles.orderStatusText,
            { color: getOrderStatusColor(order.status) }
          ]}>
            {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.orderItems}>
        {order.items.length} item{order.items.length > 1 ? 's' : ''} • {formatCurrency(order.total_amount)}
      </Text>
      <Text style={styles.orderDate}>
        {new Date(order.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </TouchableOpacity>
  ));

  if (loading && !user) {
    return (
      <View style={styles.container}>
        <Header title="Home" subtitle="Welcome back!" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user...</Text>
        </View>
      </View>
    );
  }

  
  return (
    <View style={styles.container}>
      <Header 
        title={`${getGreeting()}!`} 
        subtitle={`${user?.firstName || ''} ${user?.lastName || ''}`}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Community Info Card */}
        <Card style={styles.welcomeCard} padding={5}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeTitle}>Welcome to</Text>
              <Text style={styles.communityName}>
                {community?.name || 'Your Community'}
              </Text>
              {user?.apartmentNumber && (
                <Text style={styles.apartmentNumber}>Apartment {user.apartmentNumber}</Text>
              )}
              {community?.community_code && (
                <Text style={styles.communityCode}>Community Code: {community.community_code}</Text>
              )}
            </View>
            <View style={styles.welcomeIcon}>
              <Ionicons 
                name="home" 
                size={32} 
                color={theme.colors.primary[600]} 
              />
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard} padding={4}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Browse Vendors"
              icon="storefront"
              color={theme.colors.primary[600]}
              onPress={() => navigation.navigate('UserVendors')}
            />
            <QuickActionCard
              title="Order History"
              icon="receipt"
              color={theme.colors.secondary[600]}
              onPress={() => navigation.navigate('OrderHistory')}
            />
            <QuickActionCard
              title="My Profile"
              icon="person"
              color={theme.colors.success[600]}
              onPress={() => navigation.navigate('UserProfile')}
            />
            <QuickActionCard
              title="Support"
              icon="help-circle"
              color={theme.colors.warning[600]}
              onPress={() => navigation.navigate('Support')}
            />
          </View>
        </Card>

        {/* Popular Vendors */}
        {vendors.length > 0 && (
          <Card style={styles.vendorsCard} padding={4}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Vendors</Text>
              <TouchableOpacity onPress={() => navigation.navigate('UserVendors')}>
                <Text style={styles.viewAllButton}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.vendorsRow}>
                {vendors.map(vendor => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <Card style={styles.ordersCard} padding={4}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
                <Text style={styles.viewAllButton}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </Card>
        )}

        {/* Empty State */}
        {vendors.length === 0 && recentOrders.length === 0 && (
          <Card style={styles.emptyCard} padding={6}>
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyTitle}>Welcome to CommunityExpress!</Text>
              <Text style={styles.emptySubtitle}>
                Start by browsing vendors in your community
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('UserVendors')}
              >
                <Text style={styles.emptyButtonText}>Browse Vendors</Text>
              </TouchableOpacity>
            </View>
          </Card>
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  welcomeCard: {
    marginBottom: theme.spacing[4],
  },

  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  welcomeTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  communityName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[1],
  },

  apartmentNumber: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    marginTop: theme.spacing[1],
  },

  communityCode: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginTop: theme.spacing[1],
  },

  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickActionsCard: {
    marginBottom: theme.spacing[4],
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  quickActionCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[2],
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing[3],
  },

  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },

  quickActionTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
    textAlign: 'center',
  },

  vendorsCard: {
    marginBottom: theme.spacing[4],
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },

  viewAllButton: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  vendorsRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },

  vendorCard: {
    width: 140,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },

  vendorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[2],
  },

  vendorInfo: {
    flex: 1,
  },

  vendorName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },

  vendorType: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  vendorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },

  vendorStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },

  vendorStatText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  ordersCard: {
    marginBottom: theme.spacing[4],
  },

  orderCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing[2],
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },

  orderVendor: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    flex: 1,
  },

  orderStatusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
  },

  orderStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  orderItems: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  orderDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },

  emptyCard: {
    marginBottom: theme.spacing[4],
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },

  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },

  emptyButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.lg,
  },

  emptyButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  bottomSpacer: {
    height: theme.spacing[8],
  },
});

export default UserHomeScreen;