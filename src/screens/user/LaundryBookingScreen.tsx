import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { LaundryService, LaundryVendor, LaundryOrderCreate } from '../../services/laundry';

interface CartItem {
  id: string;
  name: string;
  price_per_piece: number;
  quantity: number;
  specialInstructions?: string;
}

const LaundryBookingScreen = ({ route, navigation }: any) => {
  const { vendor, cart }: { vendor: LaundryVendor; cart: CartItem[] } = route.params;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [pickupAddress, setPickupAddress] = useState(user?.apartmentNumber ? `Apartment ${user.apartmentNumber}` : '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const timeSlots = LaundryService.getTimeSlots();
  const paymentMethods = [
    { id: 'dummy', name: 'Dummy Payment', icon: 'card-outline' },
    { id: 'cash', name: 'Cash on Delivery', icon: 'cash-outline' },
    { id: 'upi', name: 'UPI Payment', icon: 'phone-portrait-outline' },
  ];

  const getTotalAmount = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price_per_piece * item.quantity), 0);
    const pickupCharge = vendor.pickup_charge;
    const deliveryCharge = vendor.delivery_charge;
    const taxAmount = (subtotal + pickupCharge + deliveryCharge) * 0.18; // 18% GST
    return {
      subtotal,
      pickupCharge,
      deliveryCharge,
      taxAmount,
      total: subtotal + pickupCharge + deliveryCharge + taxAmount
    };
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        Alert.alert('Invalid Date', 'Please select a future date for pickup.');
        return;
      }
      
      setPickupDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!pickupAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter pickup address.');
      return false;
    }
    
    if (!selectedTimeSlot) {
      Alert.alert('Missing Information', 'Please select a pickup time slot.');
      return false;
    }
    
    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const orderData: LaundryOrderCreate = {
        laundry_vendor_id: vendor.id,
        pickup_address: pickupAddress.trim(),
        pickup_date: pickupDate.toISOString().split('T')[0],
        pickup_time_slot: selectedTimeSlot,
        pickup_instructions: pickupInstructions.trim() || undefined,
        delivery_address: deliveryAddress.trim() || undefined,
        delivery_instructions: deliveryInstructions.trim() || undefined,
        items: cart.map(item => ({
          laundry_item_id: item.id,
          quantity: item.quantity,
          special_instructions: item.specialInstructions || undefined,
        })),
      };

      const order = await LaundryService.createLaundryOrder(orderData);
      
      // Process payment if payment method is selected
      if (paymentMethod) {
        await LaundryService.processPayment(order.id, {
          payment_method: paymentMethod,
        });
      }

      Alert.alert(
        'Booking Confirmed!',
        `Your laundry order ${order.order_number} has been placed successfully.`,
        [
          {
            text: 'View Order',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'UserHome' },
                  { name: 'LaundryOrderDetails', params: { orderId: order.id } },
                ],
              });
            },
          },
          {
            text: 'Go Home',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'UserHome' }],
              });
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error creating laundry order:', error);
      Alert.alert('Booking Failed', 'Failed to create your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, pickupCharge, deliveryCharge, taxAmount, total } = getTotalAmount();

  return (
    <View style={styles.container}>
      <Header 
        title="Book Laundry Service" 
        subtitle="Complete your booking"
        showBack={true}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <Card style={styles.summaryCard} padding={4}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorIcon}>
              <Ionicons name="shirt-outline" size={20} color={theme.colors.primary[600]} />
            </View>
            <Text style={styles.vendorName}>{vendor.business_name}</Text>
          </View>
          
          {cart.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                {item.specialInstructions && (
                  <Text style={styles.itemInstructions}>Note: {item.specialInstructions}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>₹{(item.price_per_piece * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </Card>

        {/* Pickup Details */}
        <Card style={styles.sectionCard} padding={4}>
          <Text style={styles.sectionTitle}>Pickup Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your pickup address"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {pickupDate.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Time Slot</Text>
            <TouchableOpacity
              style={styles.timeSlotInput}
              onPress={() => setShowTimeSlotModal(true)}
            >
              <Text style={[styles.timeSlotText, !selectedTimeSlot && styles.placeholderText]}>
                {selectedTimeSlot || 'Select time slot'}
              </Text>
              <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Instructions (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any special instructions for pickup..."
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
              multiline
            />
          </View>
        </Card>

        {/* Delivery Details */}
        <Card style={styles.sectionCard} padding={4}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Address (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Leave empty for same as pickup address"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Instructions (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any special instructions for delivery..."
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              multiline
            />
          </View>
        </Card>

        {/* Payment Summary */}
        <Card style={styles.summaryCard} padding={4}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.paymentBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Pickup</Text>
              <Text style={styles.breakdownValue}>
                {pickupCharge > 0 ? `₹${pickupCharge.toFixed(2)}` : 'Free'}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Delivery</Text>
              <Text style={styles.breakdownValue}>
                {deliveryCharge > 0 ? `₹${deliveryCharge.toFixed(2)}` : 'Free'}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Tax (18%)</Text>
              <Text style={styles.breakdownValue}>₹{taxAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.paymentMethodButton}
            onPress={() => setShowPaymentModal(true)}
          >
            <Text style={styles.paymentMethodLabel}>Payment Method</Text>
            <View style={styles.paymentMethodValue}>
              <Text style={[styles.paymentMethodText, !paymentMethod && styles.placeholderText]}>
                {paymentMethod ? paymentMethods.find(p => p.id === paymentMethod)?.name : 'Select payment method'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </View>
          </TouchableOpacity>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bookingFooter}>
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size="small" color={theme.colors.white} />
          ) : (
            <>
              <Text style={styles.bookButtonText}>Book Service</Text>
              <Text style={styles.bookButtonPrice}>₹{total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={pickupDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Slot Modal */}
      <Modal
        visible={showTimeSlotModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTimeSlotModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Time Slot</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.timeSlotOption,
                  selectedTimeSlot === slot && styles.timeSlotOptionSelected
                ]}
                onPress={() => {
                  setSelectedTimeSlot(slot);
                  setShowTimeSlotModal(false);
                }}
              >
                <Text style={[
                  styles.timeSlotOptionText,
                  selectedTimeSlot === slot && styles.timeSlotOptionTextSelected
                ]}>
                  {slot}
                </Text>
                {selectedTimeSlot === slot && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payment Method</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === method.id && styles.paymentOptionSelected
                ]}
                onPress={() => {
                  setPaymentMethod(method.id);
                  setShowPaymentModal(false);
                }}
              >
                <View style={styles.paymentOptionContent}>
                  <Ionicons name={method.icon as any} size={24} color={theme.colors.text.primary} />
                  <Text style={styles.paymentOptionText}>{method.name}</Text>
                </View>
                {paymentMethod === method.id && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))}
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

  summaryCard: {
    marginBottom: theme.spacing[4],
  },

  sectionCard: {
    marginBottom: theme.spacing[4],
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },

  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  vendorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[2],
  },

  vendorName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },

  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  itemQuantity: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  itemInstructions: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: theme.spacing[1],
  },

  itemPrice: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
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

  textInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 48,
  },

  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 48,
  },

  dateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },

  timeSlotInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 48,
  },

  timeSlotText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },

  placeholderText: {
    color: theme.colors.text.tertiary,
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

  paymentMethodButton: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    padding: theme.spacing[4],
  },

  paymentMethodLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },

  paymentMethodValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  paymentMethodText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },

  bottomSpacer: {
    height: theme.spacing[8],
  },

  bookingFooter: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },

  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[6],
  },

  bookButtonDisabled: {
    backgroundColor: theme.colors.gray[400],
  },

  bookButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.white,
  },

  bookButtonPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.white,
  },

  // Modal styles
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

  modalHeaderSpacer: {
    width: 60,
  },

  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  modalCancelButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },

  modalContent: {
    flex: 1,
    padding: theme.spacing[4],
  },

  timeSlotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  timeSlotOptionSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },

  timeSlotOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },

  timeSlotOptionTextSelected: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  paymentOptionSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },

  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },

  paymentOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
});

export default LaundryBookingScreen;