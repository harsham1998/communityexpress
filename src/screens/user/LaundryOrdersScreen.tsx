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
import { LaundryService, LaundryOrder } from '../../services/laundry';

const LaundryOrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusFilters = [
    { value: 'all', label: 'All Orders', count: 0 },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'confirmed', label: 'Confirmed', count: 0 },
    { value: 'picked_up', label: 'Picked Up', count: 0 },
    { value: 'in_process', label: 'In Process', count: 0 },
    { value: 'ready', label: 'Ready', count: 0 },
    { value: 'delivered', label: 'Delivered', count: 0 },
    { value: 'cancelled', label: 'Cancelled', count: 0 },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await LaundryService.getLaundryOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getFilteredOrders = () => {
    if (selectedStatus === 'all') return orders;
    return orders.filter(order => order.status === selectedStatus);
  };

  const getStatusCounts = () => {
    const counts = statusFilters.map(filter => ({
      ...filter,
      count: filter.value === 'all' ? orders.length : orders.filter(order => order.status === filter.value).length
    }));
    return counts;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const OrderCard = ({ order }: { order: LaundryOrder }) => (
    <Card style={styles.orderCard} padding={0}>
      <TouchableOpacity
        onPress={() => navigation.navigate('LaundryOrderDetails', { orderId: order.id })}
        style={styles.orderContent}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{order.order_number}</Text>
            <Text style={styles.vendorName}>{order.vendor_business_name}</Text>
          </View>
          <View style={styles.orderStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: LaundryService.getStatusColor(order.status) + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: LaundryService.getStatusColor(order.status) }
              ]}>
                {LaundryService.getStatusText(order.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.gray[500]} />
            <Text style={styles.detailText}>
              Pickup: {new Date(order.pickup_date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })} • {order.pickup_time_slot}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="shirt-outline" size={16} color={theme.colors.gray[500]} />
            <Text style={styles.detailText}>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.gray[500]} />
            <Text style={styles.detailText}>
              Ordered {formatDate(order.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderTotal}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{order.total_amount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.paymentStatus}>
            <View style={[
              styles.paymentBadge,
              { backgroundColor: LaundryService.getPaymentStatusColor(order.payment_status) + '20' }
            ]}>
              <Text style={[
                styles.paymentText,
                { color: LaundryService.getPaymentStatusColor(order.payment_status) }
              ]}>
                {order.payment_status === 'paid' ? 'Paid' : 
                 order.payment_status === 'pending' ? 'Pending' : 
                 order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('LaundryOrderDetails', { orderId: order.id })}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const filteredOrders = getFilteredOrders();
  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="My Laundry Orders" subtitle="Loading orders..." />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Laundry Orders" subtitle="Track your orders" />
      
      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilter}
        contentContainerStyle={styles.statusContent}
      >
        {statusCounts.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusButton,
              selectedStatus === status.value && styles.statusButtonActive
            ]}
            onPress={() => setSelectedStatus(status.value)}
          >
            <Text style={[
              styles.statusButtonText,
              selectedStatus === status.value && styles.statusButtonTextActive
            ]}>
              {status.label}
            </Text>
            {status.count > 0 && (
              <View style={[
                styles.statusCount,
                selectedStatus === status.value && styles.statusCountActive
              ]}>
                <Text style={[
                  styles.statusCountText,
                  selectedStatus === status.value && styles.statusCountTextActive
                ]}>
                  {status.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length === 0 ? (
          <Card style={styles.emptyCard} padding={6}>
            <View style={styles.emptyContent}>
              <Ionicons name="receipt-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyTitle}>
                {selectedStatus === 'all' ? 'No Orders Yet' : `No ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Orders`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedStatus === 'all' 
                  ? "You haven't placed any laundry orders yet."
                  : `You don't have any ${selectedStatus} orders at the moment.`
                }
              </Text>
              {selectedStatus === 'all' && (
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('LaundryVendors')}
                >
                  <Text style={styles.browseButtonText}>Browse Services</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ) : (
          <>
            <View style={styles.ordersHeader}>
              <Text style={styles.ordersCount}>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {selectedStatus !== 'all' && ` • ${selectedStatus}`}
              </Text>
            </View>

            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
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

  statusFilter: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  statusContent: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[2],
  },

  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    gap: theme.spacing[1],
  },

  statusButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },

  statusButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  statusButtonTextActive: {
    color: theme.colors.white,
  },

  statusCount: {
    backgroundColor: theme.colors.gray[300],
    borderRadius: theme.radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[1],
  },

  statusCountActive: {
    backgroundColor: theme.colors.white,
  },

  statusCountText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },

  statusCountTextActive: {
    color: theme.colors.primary[600],
  },

  content: {
    flex: 1,
    padding: theme.spacing[4],
  },

  ordersHeader: {
    marginBottom: theme.spacing[4],
  },

  ordersCount: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  orderCard: {
    marginBottom: theme.spacing[3],
  },

  orderContent: {
    padding: theme.spacing[4],
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },

  orderInfo: {
    flex: 1,
  },

  orderNumber: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  vendorName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  orderStatus: {
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  orderDetails: {
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

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },

  orderTotal: {
    alignItems: 'flex-start',
  },

  totalLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  totalAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },

  paymentStatus: {
    alignItems: 'flex-end',
  },

  paymentBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.sm,
  },

  paymentText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.radius.md,
    gap: theme.spacing[1],
  },

  viewButtonText: {
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
    marginBottom: theme.spacing[4],
  },

  browseButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
  },

  browseButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.white,
  },

  bottomSpacer: {
    height: theme.spacing[8],
  },
});

export default LaundryOrdersScreen;