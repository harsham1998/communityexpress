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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';
import { OrdersService, Order, OrderStatus } from '../../services/orders';

const OrderHistoryScreen = ({ navigation }: { navigation?: any }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [hasError, setHasError] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const ordersData = await OrdersService.getUserOrders();
      
      // Sort by most recent first
      const sortedOrders = ordersData.sort((a, b) => {
        try {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        } catch (error) {
          return 0;
        }
      });
      setOrders(sortedOrders);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getOrderStatusColor = (status?: OrderStatus) => {
    switch (status) {
      case 'delivered': return theme.colors.success[600];
      case 'out_for_delivery': return theme.colors.primary[600];
      case 'preparing': return theme.colors.warning[600];
      case 'confirmed': return theme.colors.primary[600];
      case 'cancelled': return theme.colors.error[600];
      default: return theme.colors.gray[500];
    }
  };

  const getOrderStatusIcon = (status?: OrderStatus) => {
    switch (status) {
      case 'delivered': return 'checkmark-circle';
      case 'out_for_delivery': return 'car';
      case 'preparing': return 'restaurant';
      case 'confirmed': return 'thumbs-up';
      case 'cancelled': return 'close-circle';
      default: return 'time';
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      Alert.alert('Cannot Cancel', 'This order cannot be cancelled');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await OrdersService.cancelOrder(order.id);
              Alert.alert('Order Cancelled', 'Your order has been cancelled successfully');
              loadOrders();
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const handleReorder = async (order: Order) => {
    try {
      await OrdersService.reorderItems(order.id);
      Alert.alert('Reorder Successful', 'Items have been added to your cart');
    } catch (error) {
      console.error('Error reordering:', error);
      Alert.alert('Error', 'Failed to reorder items');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const matchesSearch = (order.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.items || []).some(item => (item.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const OrderCard = React.memo(({ order }: { order: Order }) => {
    if (!order) return null;
    
    try {
      return (
      <Card style={styles.orderCard} padding={4}>
        <TouchableOpacity 
          onPress={() => navigation?.navigate?.('OrderDetails', { orderId: order.id })}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderVendor}>{order.vendor_name || 'Unknown Vendor'}</Text>
            <Text style={styles.orderDate}>
              {order.created_at 
                ? new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Date not available'
              }
            </Text>
          </View>
          <View style={[
            styles.orderStatusBadge,
            { backgroundColor: getOrderStatusColor(order.status) + '20' }
          ]}>
            <Ionicons
              name={getOrderStatusIcon(order.status) as keyof typeof Ionicons.glyphMap}
              size={14}
              color={getOrderStatusColor(order.status)}
              style={styles.statusIcon}
            />
            <Text style={[
              styles.orderStatusText,
              { color: getOrderStatusColor(order.status) }
            ]}>
              {(order.status || 'unknown').replace('_', ' ').charAt(0).toUpperCase() + (order.status || 'unknown').replace('_', ' ').slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          <Text style={styles.orderItemsText}>
            {(order.items || []).length} item{(order.items || []).length > 1 ? 's' : ''}
            {(order.items || []).length <= 2 && (order.items || []).length > 0 && (
              <Text style={styles.itemNames}>
                {' • ' + (order.items || []).map(item => `${item?.quantity || 0}x ${item?.product_name || 'Unknown item'}`).join(', ')}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{formatCurrency(order.total_amount || 0)}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
        </View>
      </TouchableOpacity>

      <View style={styles.orderActions}>
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelOrder(order)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'delivered' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reorderButton]}
            onPress={() => handleReorder(order)}
          >
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        )}
        </View>
      </Card>
      );
    } catch (error) {
      return (
        <Card style={styles.orderCard} padding={4}>
          <Text style={styles.orderVendor}>Error loading order</Text>
        </Card>
      );
    }
  });

  if (loading && orders.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Order History" subtitle="Your past orders" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  
  if (hasError) {
    return (
      <View style={styles.container}>
        <Header title="Order History" subtitle="Error loading orders" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Something went wrong. Please try refreshing.</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              setHasError(false);
              loadOrders();
            }}
          >
            <Text style={styles.emptyButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  try {
    return (
    <View style={styles.container}>
      <Header 
        title="Order History" 
        subtitle={`${filteredOrders.length} orders found`}
      />
      
      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.gray[400]}
          />
        </View>

        {/* Status Filter */}
        <Card style={styles.filterCard} padding={3}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterStatus === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus('all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === 'all' && styles.filterButtonTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as OrderStatus[]).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    filterStatus === status && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Ionicons
                    name={getOrderStatusIcon(status) as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={filterStatus === status ? theme.colors.white : getOrderStatusColor(status)}
                    style={styles.filterIcon}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    filterStatus === status && styles.filterButtonTextActive
                  ]}>
                    {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Orders List */}
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
          
          {filteredOrders.length === 0 && (
            <Card style={styles.emptyCard} padding={6}>
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={theme.colors.gray[400]} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No orders match your search' : 'No orders yet'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Start browsing vendors to place your first order'
                  }
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => navigation?.navigate?.('UserVendors')}
                  >
                    <Text style={styles.emptyButtonText}>Browse Vendors</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </View>
    );
  } catch (error) {
    setHasError(true);
    return (
      <View style={styles.container}>
        <Header title="Order History" subtitle="Error" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Something went wrong. Please restart the app.</Text>
        </View>
      </View>
    );
  }
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
  
  orderCard: {
    marginBottom: theme.spacing[3],
  },
  
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  
  orderInfo: {
    flex: 1,
  },
  
  orderVendor: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  
  orderDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
    gap: theme.spacing[1],
  },

  statusIcon: {
    // Styling handled by parent
  },
  
  orderStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  orderItems: {
    marginBottom: theme.spacing[2],
  },
  
  orderItemsText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  itemNames: {
    color: theme.colors.text.tertiary,
  },
  
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  
  orderTotal: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing[2],
    paddingTop: theme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  
  actionButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  
  cancelButton: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
  },
  
  cancelButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  
  reorderButton: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  
  reorderButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
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

export default OrderHistoryScreen;