import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { theme } from '../../theme';
import { LaundryService, LaundryOrder } from '../../services/laundry';

const LaundryOrderDetailsScreen = ({ route }: any) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<LaundryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await LaundryService.getLaundryOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  };

  const cancelOrder = () => {
    if (!order) return;

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
              await LaundryService.updateLaundryOrder(order.id, { status: 'cancelled' });
              loadOrder();
              Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            }
          },
        },
      ]
    );
  };

  const callVendor = () => {
    if (!order?.user_phone) {
      Alert.alert('No Phone Number', 'Vendor phone number is not available.');
      return;
    }
    
    Linking.openURL(`tel:${order.user_phone}`);
  };

  interface StatusStep {
    key: string;
    label: string;
    icon: string;
    completed?: boolean;
    active?: boolean;
  }

  const getStatusSteps = (): StatusStep[] => {
    const steps: StatusStep[] = [
      { key: 'pending', label: 'Order Placed', icon: 'checkmark-circle' },
      { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle' },
      { key: 'picked_up', label: 'Picked Up', icon: 'car' },
      { key: 'in_process', label: 'In Process', icon: 'sync' },
      { key: 'ready', label: 'Ready', icon: 'checkmark-done' },
      { key: 'delivered', label: 'Delivered', icon: 'home' },
    ];

    if (!order) return steps;

    const currentStepIndex = steps.findIndex(step => step.key === order.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex || (index === currentStepIndex && order.status !== 'cancelled'),
      active: index === currentStepIndex && order.status !== 'cancelled',
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Order Details" subtitle="Loading..." showBack={true} />
        <LoadingSpinner />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="Order Details" subtitle="Order not found" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </View>
    );
  }

  const steps = getStatusSteps();
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <View style={styles.container}>
      <Header 
        title={`Order ${order.order_number}`} 
        subtitle={LaundryService.getStatusText(order.status)}
        showBack={true}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <Card style={styles.statusCard} padding={4}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: LaundryService.getStatusColor(order.status) + '20' }]}>
              <Ionicons
                name={order.status === 'cancelled' ? 'close-circle' : 'checkmark-circle'}
                size={24}
                color={LaundryService.getStatusColor(order.status)}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>{LaundryService.getStatusText(order.status)}</Text>
              <Text style={styles.statusTime}>
                {order.status === 'delivered' && order.delivered_at
                  ? `Delivered on ${formatDateTime(order.delivered_at)}`
                  : order.status === 'cancelled' && order.cancelled_at
                  ? `Cancelled on ${formatDateTime(order.cancelled_at)}`
                  : `Ordered on ${formatDateTime(order.created_at)}`}
              </Text>
            </View>
          </View>

          {/* Status Progress */}
          {order.status !== 'cancelled' && (
            <View style={styles.statusProgress}>
              {steps.map((step, index) => (
                <View key={step.key} style={styles.progressStep}>
                  <View style={styles.progressLine}>
                    <View style={[
                      styles.progressDot,
                      step.completed && styles.progressDotCompleted,
                      step.active && styles.progressDotActive,
                    ]}>
                      {step.completed && !step.active && (
                        <Ionicons name="checkmark" size={12} color={theme.colors.white} />
                      )}
                    </View>
                    {index < steps.length - 1 && (
                      <View style={[
                        styles.progressConnector,
                        step.completed && styles.progressConnectorCompleted,
                      ]} />
                    )}
                  </View>
                  <Text style={[
                    styles.progressLabel,
                    step.active && styles.progressLabelActive,
                    step.completed && styles.progressLabelCompleted,
                  ]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Vendor Info */}
        <Card style={styles.vendorCard} padding={4}>
          <View style={styles.vendorHeader}>
            <View style={styles.vendorIcon}>
              <Ionicons name="shirt-outline" size={24} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{order.vendor_business_name}</Text>
              <Text style={styles.vendorMeta}>Laundry Service</Text>
            </View>
            {order.user_phone && (
              <TouchableOpacity style={styles.callButton} onPress={callVendor}>
                <Ionicons name="call" size={20} color={theme.colors.primary[600]} />
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Order Items */}
        <Card style={styles.itemsCard} padding={4}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemCategory}>{item.item_category}</Text>
                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                {item.special_instructions && (
                  <Text style={styles.itemInstructions}>Note: {item.special_instructions}</Text>
                )}
              </View>
              <View style={styles.itemPricing}>
                <Text style={styles.itemPrice}>₹{item.total_price.toFixed(2)}</Text>
                <Text style={styles.itemUnitPrice}>₹{item.unit_price} each</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Pickup & Delivery Details */}
        <Card style={styles.detailsCard} padding={4}>
          <Text style={styles.sectionTitle}>Pickup & Delivery</Text>
          
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary[600]} />
              <Text style={styles.detailTitle}>Pickup Details</Text>
            </View>
            <Text style={styles.detailText}>{order.pickup_address}</Text>
            <Text style={styles.detailMeta}>
              {formatDate(order.pickup_date)} • {order.pickup_time_slot}
            </Text>
            {order.pickup_instructions && (
              <Text style={styles.detailInstructions}>Instructions: {order.pickup_instructions}</Text>
            )}
          </View>

          {order.delivery_address !== order.pickup_address && (
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <Ionicons name="home-outline" size={20} color={theme.colors.secondary[600]} />
                <Text style={styles.detailTitle}>Delivery Details</Text>
              </View>
              <Text style={styles.detailText}>{order.delivery_address}</Text>
              {order.estimated_delivery_date && (
                <Text style={styles.detailMeta}>
                  Expected: {formatDate(order.estimated_delivery_date)}
                  {order.estimated_delivery_time && ` • ${order.estimated_delivery_time}`}
                </Text>
              )}
              {order.delivery_instructions && (
                <Text style={styles.detailInstructions}>Instructions: {order.delivery_instructions}</Text>
              )}
            </View>
          )}
        </Card>

        {/* Payment Summary */}
        <Card style={styles.paymentCard} padding={4}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.paymentBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>₹{order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Pickup</Text>
              <Text style={styles.breakdownValue}>
                {order.pickup_charge > 0 ? `₹${order.pickup_charge.toFixed(2)}` : 'Free'}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Delivery</Text>
              <Text style={styles.breakdownValue}>
                {order.delivery_charge > 0 ? `₹${order.delivery_charge.toFixed(2)}` : 'Free'}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Tax</Text>
              <Text style={styles.breakdownValue}>₹{order.tax_amount.toFixed(2)}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>₹{order.total_amount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.paymentStatus}>
            <View style={[
              styles.paymentStatusBadge,
              { backgroundColor: LaundryService.getPaymentStatusColor(order.payment_status) + '20' }
            ]}>
              <Text style={[
                styles.paymentStatusText,
                { color: LaundryService.getPaymentStatusColor(order.payment_status) }
              ]}>
                {order.payment_status === 'paid' ? 'Paid' : 
                 order.payment_status === 'pending' ? 'Payment Pending' : 
                 order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </Text>
            </View>
            {order.payment_method && (
              <Text style={styles.paymentMethod}>via {order.payment_method}</Text>
            )}
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      {canCancel && (
        <View style={styles.actionFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelOrder}>
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },

  statusCard: {
    marginBottom: theme.spacing[4],
  },

  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },

  statusInfo: {
    flex: 1,
  },

  statusText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  statusTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  statusProgress: {
    paddingHorizontal: theme.spacing[4],
  },

  progressStep: {
    marginBottom: theme.spacing[3],
  },

  progressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },

  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressDotCompleted: {
    backgroundColor: theme.colors.success[600],
  },

  progressDotActive: {
    backgroundColor: theme.colors.primary[600],
  },

  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.gray[300],
    marginLeft: theme.spacing[2],
  },

  progressConnectorCompleted: {
    backgroundColor: theme.colors.success[600],
  },

  progressLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },

  progressLabelActive: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  progressLabelCompleted: {
    color: theme.colors.success[600],
  },

  vendorCard: {
    marginBottom: theme.spacing[4],
  },

  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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

  vendorMeta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemsCard: {
    marginBottom: theme.spacing[4],
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },

  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  itemCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  itemQuantity: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  itemInstructions: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: theme.spacing[1],
  },

  itemPricing: {
    alignItems: 'flex-end',
  },

  itemPrice: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  itemUnitPrice: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  detailsCard: {
    marginBottom: theme.spacing[4],
  },

  detailSection: {
    marginBottom: theme.spacing[4],
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },

  detailTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[2],
  },

  detailText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  detailMeta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  detailInstructions: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },

  paymentCard: {
    marginBottom: theme.spacing[4],
  },

  paymentBreakdown: {
    marginBottom: theme.spacing[4],
  },

  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[1],
  },

  breakdownLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  breakdownValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing[2],
    marginTop: theme.spacing[2],
  },

  totalLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  totalValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },

  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  paymentStatusBadge: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
  },

  paymentStatusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  paymentMethod: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  bottomSpacer: {
    height: theme.spacing[8],
  },

  actionFooter: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },

  cancelButton: {
    backgroundColor: theme.colors.error[600],
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.white,
  },
});

export default LaundryOrderDetailsScreen;