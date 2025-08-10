import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { theme } from '../../theme';
import { LaundryService, LaundryOrder, LaundryVendor } from '../../services/laundry';
import { useAuth } from '../../context/AuthContext';

interface DashboardStats {
  stats: {
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    in_process_orders: number;
    ready_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    today_revenue: number;
    monthly_revenue: number;
    active_items: number;
  };
  recent_orders: LaundryOrder[];
}

const LaundryVendorDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [vendorData, setVendorData] = useState<LaundryVendor | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (user.role !== 'vendor') {
        throw new Error('Access denied: User is not a vendor');
      }

      // First, get all laundry vendors and find the one associated with current user
      // This is a temporary solution - ideally the backend should provide a user-specific endpoint
      console.log('🔍 Loading vendors for community:', user.communityId);
      const vendors = await LaundryService.getAllLaundryVendors(user.communityId);
      
      // For now, we'll assume the vendor is associated with the user's community
      // In a real implementation, there should be a direct user-vendor relationship
      const userVendor = vendors.find((vendor: LaundryVendor) => 
        vendor.business_name.toLowerCase().includes(user.firstName.toLowerCase()) ||
        vendor.business_name.toLowerCase().includes(user.lastName.toLowerCase())
      );

      if (!userVendor) {
        // If we can't find by name, try to use the first vendor from the user's community
        // This is a fallback - in production you'd have proper user-vendor mapping
        const communityVendors = vendors.filter((vendor: LaundryVendor) => vendor.vendor_id);
        if (communityVendors.length > 0) {
          setVendorData(communityVendors[0]);
          const dashboardData = await LaundryService.getVendorDashboard(communityVendors[0].id);
          setStats(dashboardData);
        } else {
          throw new Error('No laundry vendor profile found for this user. Please contact support.');
        }
      } else {
        setVendorData(userVendor);
        const dashboardData = await LaundryService.getVendorDashboard(userVendor.id);
        setStats(dashboardData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    onPress 
  }: { 
    title: string; 
    value: string | number; 
    icon: keyof typeof Ionicons.glyphMap; 
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.statCard, onPress && styles.statCardTouchable]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
      )}
    </TouchableOpacity>
  );

  const OrderCard = ({ order }: { order: LaundryOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('LaundryOrderDetails', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{order.order_number}</Text>
        <View style={[
          styles.orderStatusBadge,
          { backgroundColor: LaundryService.getStatusColor(order.status) + '20' }
        ]}>
          <Text style={[
            styles.orderStatusText,
            { color: LaundryService.getStatusColor(order.status) }
          ]}>
            {LaundryService.getStatusText(order.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.customerName}>{order.user_name}</Text>
        <Text style={styles.orderAmount}>{formatCurrency(order.total_amount)}</Text>
      </View>
      
      <View style={styles.orderMeta}>
        <Text style={styles.orderDate}>
          {new Date(order.created_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <Text style={styles.itemCount}>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Laundry Dashboard" subtitle="Loading..." />
        <LoadingSpinner />
      </View>
    );
  }

  if (!user || user.role !== 'vendor') {
    return (
      <View style={styles.container}>
        <Header title="Laundry Dashboard" subtitle="Access Denied" />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning[500]} />
          <Text style={styles.errorText}>Access denied</Text>
          <Text style={styles.errorSubtext}>You must be logged in as a vendor to access this page.</Text>
        </View>
      </View>
    );
  }

  if (!vendorData || !stats) {
    return (
      <View style={styles.container}>
        <Header title="Laundry Dashboard" subtitle="Setup Required" />
        <View style={styles.errorContainer}>
          <Ionicons name="business" size={48} color={theme.colors.gray[400]} />
          <Text style={styles.errorText}>No vendor profile found</Text>
          <Text style={styles.errorSubtext}>Please contact support to set up your vendor profile.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={vendorData.business_name} 
        subtitle="Laundry Dashboard"
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Revenue Cards */}
        <View style={styles.revenueSection}>
          <Card style={styles.revenueCard} padding={4}>
            <View style={styles.revenueHeader}>
              <View style={styles.revenueIcon}>
                <Ionicons name="cash" size={24} color={theme.colors.success[600]} />
              </View>
              <View style={styles.revenueInfo}>
                <Text style={styles.revenueTitle}>Today's Revenue</Text>
                <Text style={styles.revenueAmount}>{formatCurrency(stats.stats.today_revenue)}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.revenueCard} padding={4}>
            <View style={styles.revenueHeader}>
              <View style={styles.revenueIcon}>
                <Ionicons name="trending-up" size={24} color={theme.colors.primary[600]} />
              </View>
              <View style={styles.revenueInfo}>
                <Text style={styles.revenueTitle}>This Month</Text>
                <Text style={styles.revenueAmount}>{formatCurrency(stats.stats.monthly_revenue)}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Order Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Orders"
              value={stats.stats.total_orders}
              icon="receipt"
              color={theme.colors.blue[600]}
              onPress={() => navigation.navigate('LaundryOrders', { status: 'all' })}
            />
            <StatCard
              title="Pending"
              value={stats.stats.pending_orders}
              icon="time"
              color={theme.colors.yellow[600]}
              onPress={() => navigation.navigate('LaundryOrders', { status: 'pending' })}
            />
            <StatCard
              title="In Process"
              value={stats.stats.in_process_orders}
              icon="sync"
              color={theme.colors.orange[600]}
              onPress={() => navigation.navigate('LaundryOrders', { status: 'in_process' })}
            />
            <StatCard
              title="Ready"
              value={stats.stats.ready_orders}
              icon="checkmark-done"
              color={theme.colors.green[600]}
              onPress={() => navigation.navigate('LaundryOrders', { status: 'ready' })}
            />
            <StatCard
              title="Delivered"
              value={stats.stats.delivered_orders}
              icon="checkmark-circle"
              color={theme.colors.success[600]}
              onPress={() => navigation.navigate('LaundryOrders', { status: 'delivered' })}
            />
            <StatCard
              title="Active Items"
              value={stats.stats.active_items}
              icon="shirt"
              color={theme.colors.purple[600]}
              onPress={() => navigation.navigate('LaundryItems')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('LaundryOrders', { status: 'pending' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.yellow[100] }]}>
                <Ionicons name="notifications" size={24} color={theme.colors.yellow[600]} />
              </View>
              <Text style={styles.actionText}>Pending Orders</Text>
              {stats.stats.pending_orders > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{stats.stats.pending_orders}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('LaundryItems')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.blue[100] }]}>
                <Ionicons name="add-circle" size={24} color={theme.colors.blue[600]} />
              </View>
              <Text style={styles.actionText}>Manage Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('LaundryOrders', { status: 'ready' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.green[100] }]}>
                <Ionicons name="car" size={24} color={theme.colors.green[600]} />
              </View>
              <Text style={styles.actionText}>Ready for Delivery</Text>
              {stats.stats.ready_orders > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{stats.stats.ready_orders}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('VendorSettings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.gray[100] }]}>
                <Ionicons name="settings" size={24} color={theme.colors.gray[600]} />
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        {stats.recent_orders.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('LaundryOrders', { status: 'all' })}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {stats.recent_orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
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

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold as any,
  },

  errorSubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[6],
  },

  revenueSection: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[6],
  },

  revenueCard: {
    flex: 1,
  },

  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  revenueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },

  revenueInfo: {
    flex: 1,
  },

  revenueTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  revenueAmount: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },

  statsSection: {
    marginBottom: theme.spacing[6],
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },

  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  statCardTouchable: {
    ...theme.shadows.md,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },

  statContent: {
    flex: 1,
  },

  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  statTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  actionsSection: {
    marginBottom: theme.spacing[6],
  },

  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },

  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    alignItems: 'center',
    position: 'relative',
    ...theme.shadows.sm,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },

  actionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  actionBadge: {
    position: 'absolute',
    top: theme.spacing[2],
    right: theme.spacing[2],
    backgroundColor: theme.colors.error[600],
    borderRadius: theme.radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[1],
  },

  actionBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.white,
  },

  recentSection: {
    marginBottom: theme.spacing[6],
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },

  viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  orderCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    ...theme.shadows.sm,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },

  orderNumber: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  orderStatusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.sm,
  },

  orderStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },

  customerName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  orderAmount: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },

  itemCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },

  bottomSpacer: {
    height: theme.spacing[8],
  },
});

export default LaundryVendorDashboardScreen;