import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { theme } from '../../theme';
import { LaundryService, LaundryVendor, LaundryItem } from '../../services/laundry';

interface CartItem extends LaundryItem {
  quantity: number;
  specialInstructions?: string;
}

const LaundryVendorDetailsScreen = ({ route, navigation }: any) => {
  const { vendor }: { vendor: LaundryVendor } = route.params;
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');

  useEffect(() => {
    loadItems();
  }, [selectedCategory]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const itemsData = await LaundryService.getLaundryItems(
        vendor.id,
        selectedCategory === 'all' ? undefined : selectedCategory,
        true
      );
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading laundry items:', error);
      Alert.alert('Error', 'Failed to load laundry items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const categories = LaundryService.getItemCategories();
  const allCategories = [{ value: 'all', label: 'All Services' }, ...categories];

  const addToCart = (item: LaundryItem, quantity: number = 1) => {
    const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      const cartItem: CartItem = { ...item, quantity };
      setCart([...cart, cartItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
  };

  const addInstructions = () => {
    if (selectedItemId && instructions.trim()) {
      const updatedCart = cart.map(item =>
        item.id === selectedItemId 
          ? { ...item, specialInstructions: instructions.trim() }
          : item
      );
      setCart(updatedCart);
    }
    setShowInstructionsModal(false);
    setInstructions('');
    setSelectedItemId('');
  };

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

  const proceedToBooking = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding.');
      return;
    }

    const { total } = getTotalAmount();
    if (total < vendor.minimum_order_amount) {
      Alert.alert(
        'Minimum Order Amount',
        `Minimum order amount is ₹${vendor.minimum_order_amount.toFixed(2)}. Please add more items.`
      );
      return;
    }

    navigation.navigate('LaundryBooking', { vendor, cart });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCartItemQuantity = (itemId: string) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const ItemCard = ({ item }: { item: LaundryItem }) => {
    const quantity = getCartItemQuantity(item.id);
    const cartItem = cart.find(cartItem => cartItem.id === item.id);
    
    return (
      <Card style={styles.itemCard} padding={0}>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description || 'Professional laundry service'}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={styles.categoryBadge}>{categories.find(c => c.value === item.category)?.label || item.category}</Text>
                <Text style={styles.timeEstimate}>{item.estimated_time_hours}h</Text>
              </View>
            </View>
            <View style={styles.itemPrice}>
              <Text style={styles.priceText}>₹{item.price_per_piece.toFixed(2)}</Text>
              <Text style={styles.priceUnit}>per piece</Text>
            </View>
          </View>

          {quantity > 0 && (
            <View style={styles.cartControls}>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateCartQuantity(item.id, quantity - 1)}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.primary[600]} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateCartQuantity(item.id, quantity + 1)}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary[600]} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.instructionsButton}
                onPress={() => {
                  setSelectedItemId(item.id);
                  setInstructions(cartItem?.specialInstructions || '');
                  setShowInstructionsModal(true);
                }}
              >
                <Ionicons 
                  name={cartItem?.specialInstructions ? "document-text" : "document-text-outline"} 
                  size={16} 
                  color={theme.colors.primary[600]} 
                />
                <Text style={styles.instructionsText}>
                  {cartItem?.specialInstructions ? 'Edit' : 'Add'} Notes
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {quantity === 0 && (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => addToCart(item)}
            >
              <Ionicons name="add" size={20} color={theme.colors.white} />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const CartSummary = () => {
    if (cart.length === 0) return null;

    const { subtotal, pickupCharge, deliveryCharge, taxAmount, total } = getTotalAmount();

    return (
      <Card style={styles.cartSummary} padding={4}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>Cart Summary</Text>
          <Text style={styles.cartItemCount}>{cart.length} item{cart.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.cartBreakdown}>
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
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.proceedButton} onPress={proceedToBooking}>
          <Text style={styles.proceedButtonText}>Proceed to Book</Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title={vendor.business_name} 
          subtitle="Loading services..."
          showBack={true}
        />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={vendor.business_name} 
        subtitle="Select laundry services"
        showBack={true}
      />
      
      {/* Vendor Info */}
      <Card style={styles.vendorInfoCard} padding={4}>
        <View style={styles.vendorHeader}>
          <View style={styles.vendorIcon}>
            <Ionicons name="shirt-outline" size={24} color={theme.colors.primary[600]} />
          </View>
          <View style={styles.vendorDetails}>
            <Text style={styles.vendorName}>{vendor.business_name}</Text>
            <Text style={styles.vendorDescription}>
              {vendor.description || 'Professional laundry service'}
            </Text>
            <View style={styles.vendorMeta}>
              <Text style={styles.metaText}>
                {formatTime(vendor.pickup_time_start)} - {formatTime(vendor.pickup_time_end)}
              </Text>
              <Text style={styles.metaText}>•</Text>
              <Text style={styles.metaText}>Delivery in {vendor.delivery_time_hours}h</Text>
            </View>
          </View>
        </View>
      </Card>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryContent}
        >
          {allCategories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryButton,
                selectedCategory === category.value && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.value && styles.categoryButtonTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items List */}
        {items.length === 0 ? (
          <Card style={styles.emptyCard} padding={6}>
            <View style={styles.emptyContent}>
              <Ionicons name="shirt-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Services Available</Text>
              <Text style={styles.emptySubtitle}>
                This vendor doesn't have any services in the selected category.
              </Text>
            </View>
          </Card>
        ) : (
          items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Cart Summary */}
      <CartSummary />

      {/* Instructions Modal */}
      <Modal
        visible={showInstructionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInstructionsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInstructionsModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Special Instructions</Text>
            <TouchableOpacity onPress={addInstructions}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Add any special instructions for this item:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Handle with care, No starch, Extra rinse..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.characterCount}>{instructions.length}/200</Text>
          </View>
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

  vendorInfoCard: {
    margin: theme.spacing[4],
    marginBottom: theme.spacing[2],
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

  vendorDetails: {
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
    marginBottom: theme.spacing[1],
  },

  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },

  metaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },

  categoryFilter: {
    marginBottom: theme.spacing[4],
  },

  categoryContent: {
    paddingRight: theme.spacing[4],
    gap: theme.spacing[2],
  },

  categoryButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },

  categoryButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },

  categoryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  categoryButtonTextActive: {
    color: theme.colors.white,
  },

  itemCard: {
    marginBottom: theme.spacing[3],
  },

  itemContent: {
    padding: theme.spacing[4],
  },

  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },

  itemInfo: {
    flex: 1,
    marginRight: theme.spacing[3],
  },

  itemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  itemDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },

  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },

  categoryBadge: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  timeEstimate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },

  itemPrice: {
    alignItems: 'flex-end',
  },

  priceText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },

  priceUnit: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[2],
  },

  addToCartText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.white,
  },

  cartControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[2],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[1],
  },

  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },

  quantityText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing[3],
    minWidth: 40,
    textAlign: 'center',
  },

  instructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.radius.md,
    gap: theme.spacing[1],
  },

  instructionsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  cartSummary: {
    margin: theme.spacing[4],
    marginTop: 0,
  },

  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },

  cartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },

  cartItemCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  cartBreakdown: {
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

  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[2],
  },

  proceedButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.white,
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

  modalSaveButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium as any,
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },

  modalContent: {
    padding: theme.spacing[4],
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
    minHeight: 100,
    textAlignVertical: 'top',
  },

  characterCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing[1],
  },
});

export default LaundryVendorDetailsScreen;