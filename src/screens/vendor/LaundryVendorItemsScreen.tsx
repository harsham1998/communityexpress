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
import { LaundryService, LaundryItem, LaundryVendor } from '../../services/laundry';
import { useAuth } from '../../context/AuthContext';

const LaundryVendorItemsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [vendorData, setVendorData] = useState<LaundryVendor | null>(null);
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LaundryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemTime, setItemTime] = useState('24');

  const categories = LaundryService.getItemCategories();
  const allCategories = [{ value: 'all', label: 'All Categories' }, ...categories];

  useEffect(() => {
    loadItems();
  }, [selectedCategory]);

  const loadItems = async () => {
    try {
      setLoading(true);
      
      if (!user || user.role !== 'vendor') {
        throw new Error('User not authenticated as vendor');
      }

      // Get vendor data if not already loaded
      if (!vendorData) {
        const vendors = await LaundryService.getAllLaundryVendors(user.communityId);
        const userVendor = vendors.find((vendor: LaundryVendor) => 
          vendor.business_name.toLowerCase().includes(user.firstName.toLowerCase()) ||
          vendor.business_name.toLowerCase().includes(user.lastName.toLowerCase())
        ) || vendors[0]; // fallback to first vendor

        if (!userVendor) {
          throw new Error('No vendor profile found for this user');
        }

        setVendorData(userVendor);
      }

      const currentVendor = vendorData || await (async () => {
        const vendors = await LaundryService.getAllLaundryVendors(user.communityId);
        return vendors.find((vendor: LaundryVendor) => 
          vendor.business_name.toLowerCase().includes(user.firstName.toLowerCase()) ||
          vendor.business_name.toLowerCase().includes(user.lastName.toLowerCase())
        ) || vendors[0];
      })();

      if (!currentVendor) {
        throw new Error('No vendor profile found');
      }

      const itemsData = await LaundryService.getLaundryItems(
        currentVendor.id,
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const openItemModal = (item?: LaundryItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemDescription(item.description || '');
      setItemCategory(item.category);
      setItemPrice(item.price_per_piece.toString());
      setItemTime(item.estimated_time_hours.toString());
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDescription('');
      setItemCategory('');
      setItemPrice('');
      setItemTime('24');
    }
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemCategory('');
    setItemPrice('');
    setItemTime('24');
  };

  const saveItem = async () => {
    if (!itemName.trim() || !itemCategory || !itemPrice.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    const time = parseInt(itemTime);
    if (isNaN(time) || time <= 0) {
      Alert.alert('Invalid Time', 'Please enter a valid estimated time.');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingItem) {
        // Update existing item
        if (!vendorData) throw new Error('Vendor data not loaded');
        const updatedItem = await LaundryService.updateLaundryItem(vendorData.id, editingItem.id, {
          name: itemName.trim(),
          description: itemDescription.trim() || undefined,
          category: itemCategory,
          price_per_piece: price,
          estimated_time_hours: time,
        });
        
        setItems(prevItems =>
          prevItems.map(item => item.id === editingItem.id ? updatedItem : item)
        );
        
        Alert.alert('Success', 'Item updated successfully!');
      } else {
        // Create new item
        if (!vendorData) throw new Error('Vendor data not loaded');
        const newItem = await LaundryService.createLaundryItem(vendorData.id, {
          name: itemName.trim(),
          description: itemDescription.trim() || undefined,
          category: itemCategory,
          price_per_piece: price,
          estimated_time_hours: time,
        });
        
        setItems(prevItems => [newItem, ...prevItems]);
        Alert.alert('Success', 'Item added successfully!');
      }
      
      closeItemModal();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleItemAvailability = async (item: LaundryItem) => {
    try {
      if (!vendorData) throw new Error('Vendor data not loaded');
      const updatedItem = await LaundryService.updateLaundryItem(vendorData.id, item.id, {
        is_available: !item.is_available,
      });
      
      setItems(prevItems =>
        prevItems.map(i => i.id === item.id ? updatedItem : i)
      );
      
      Alert.alert(
        'Success', 
        `Item ${updatedItem.is_available ? 'enabled' : 'disabled'} successfully!`
      );
    } catch (error) {
      console.error('Error toggling item availability:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const deleteItem = (item: LaundryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!vendorData) throw new Error('Vendor data not loaded');
              await LaundryService.deleteLaundryItem(vendorData.id, item.id);
              setItems(prevItems => prevItems.filter(i => i.id !== item.id));
              Alert.alert('Success', 'Item deleted successfully!');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  const ItemCard = ({ item }: { item: LaundryItem }) => (
    <Card style={!item.is_available ? { ...styles.itemCard, ...styles.itemCardDisabled } : styles.itemCard} padding={4}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, !item.is_available && styles.itemNameDisabled]}>
            {item.name}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={styles.categoryBadge}>
              {categories.find(c => c.value === item.category)?.label || item.category}
            </Text>
            <Text style={styles.timeEstimate}>{item.estimated_time_hours}h</Text>
          </View>
        </View>
        <View style={styles.itemPricing}>
          <Text style={[styles.itemPrice, !item.is_available && styles.itemPriceDisabled]}>
            ₹{item.price_per_piece.toFixed(2)}
          </Text>
          <Text style={styles.priceUnit}>per piece</Text>
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: item.is_available ? theme.colors.success[100] : theme.colors.gray[100] }
          ]}>
            <Text style={[
              styles.availabilityText,
              { color: item.is_available ? theme.colors.success[700] : theme.colors.gray[600] }
            ]}>
              {item.is_available ? 'Available' : 'Disabled'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openItemModal(item)}
        >
          <Ionicons name="create-outline" size={16} color={theme.colors.primary[600]} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.is_available ? theme.colors.gray[100] : theme.colors.success[100] }]}
          onPress={() => toggleItemAvailability(item)}
        >
          <Ionicons 
            name={item.is_available ? "eye-off-outline" : "eye-outline"} 
            size={16} 
            color={item.is_available ? theme.colors.gray[600] : theme.colors.success[600]} 
          />
          <Text style={[
            styles.actionButtonText,
            { color: item.is_available ? theme.colors.gray[600] : theme.colors.success[600] }
          ]}>
            {item.is_available ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error[100] }]}
          onPress={() => deleteItem(item)}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.error[600]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.error[600] }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Manage Items" subtitle="Loading items..." showBack={true} />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Manage Items" 
        subtitle="Add and manage your laundry services"
        showBack={true}
      />
      
      {/* Add Item Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => openItemModal()}>
          <Ionicons name="add" size={24} color={theme.colors.white} />
          <Text style={styles.addButtonText}>Add New Item</Text>
        </TouchableOpacity>
      </View>

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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {items.length === 0 ? (
          <Card style={styles.emptyCard} padding={6}>
            <View style={styles.emptyContent}>
              <Ionicons name="shirt-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Items Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedCategory === 'all' 
                  ? "You haven't added any laundry items yet."
                  : `No items found in the ${selectedCategory} category.`
                }
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => openItemModal()}
              >
                <Text style={styles.emptyAddButtonText}>Add Your First Item</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsCount}>
                {items.length} item{items.length !== 1 ? 's' : ''}
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              </Text>
            </View>

            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Item Modal */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeItemModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeItemModal}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </Text>
            <TouchableOpacity 
              onPress={saveItem} 
              disabled={submitting}
            >
              <Text style={[
                styles.modalSaveButton,
                submitting && styles.modalSaveButtonDisabled
              ]}>
                {submitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Men's Shirt, Jeans, Dress..."
                value={itemName}
                onChangeText={setItemName}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Brief description of the item..."
                value={itemDescription}
                onChangeText={setItemDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categorySelection}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryOption,
                      itemCategory === category.value && styles.categoryOptionSelected
                    ]}
                    onPress={() => setItemCategory(category.value)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      itemCategory === category.value && styles.categoryOptionTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: theme.spacing[2] }]}>
                <Text style={styles.inputLabel}>Price per Piece (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: theme.spacing[2] }]}>
                <Text style={styles.inputLabel}>Est. Time (hours) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="24"
                  value={itemTime}
                  onChangeText={setItemTime}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputHint}>
              <Text style={styles.inputHintText}>
                * Required fields. Price should be competitive and realistic for your market.
              </Text>
            </View>

            <View style={styles.modalBottomSpacer} />
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

  addButtonContainer: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[2],
  },

  addButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.white,
  },

  categoryFilter: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  categoryContent: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
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

  content: {
    flex: 1,
    padding: theme.spacing[4],
  },

  itemsHeader: {
    marginBottom: theme.spacing[4],
  },

  itemsCount: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  itemCard: {
    marginBottom: theme.spacing[3],
  },

  itemCardDisabled: {
    opacity: 0.7,
  },

  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[4],
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

  itemNameDisabled: {
    color: theme.colors.text.secondary,
  },

  itemDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    lineHeight: 18,
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

  itemPricing: {
    alignItems: 'flex-end',
  },

  itemPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },

  itemPriceDisabled: {
    color: theme.colors.text.secondary,
  },

  priceUnit: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },

  availabilityBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.sm,
  },

  availabilityText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  itemActions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.radius.md,
    gap: theme.spacing[1],
  },

  actionButtonText: {
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

  emptyAddButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
  },

  emptyAddButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.white,
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

  modalSaveButtonDisabled: {
    color: theme.colors.text.tertiary,
  },

  modalContent: {
    flex: 1,
    padding: theme.spacing[4],
  },

  inputGroup: {
    marginBottom: theme.spacing[4],
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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

  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  categorySelection: {
    flexDirection: 'row',
  },

  categoryOption: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    marginRight: theme.spacing[2],
  },

  categoryOptionSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },

  categoryOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  categoryOptionTextSelected: {
    color: theme.colors.white,
  },

  inputHint: {
    marginTop: theme.spacing[2],
  },

  inputHintText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },

  modalBottomSpacer: {
    height: theme.spacing[8],
  },
});

export default LaundryVendorItemsScreen;