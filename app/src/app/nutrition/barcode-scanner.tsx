import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Card, Button } from '@/components/ui';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { MealType, FoodProduct } from '@/services/database.types';

const MEAL_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '🌞' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
];

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: MealType }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(params.mealType || 'snack');
  const [customQuantity, setCustomQuantity] = useState('100');

  const {
    scannedProduct,
    isLoading,
    scanBarcode,
    addFoodEntry,
    clearScannedProduct,
  } = useNutritionStore();

  useEffect(() => {
    return () => {
      clearScannedProduct();
    };
  }, []);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    const product = await scanBarcode(data);

    if (product) {
      // Set initial quantity to the product's serving size or 100g
      setCustomQuantity(String(product.servingSize || 100));
      setShowProductModal(true);
    } else {
      Alert.alert(
        'Product Not Found',
        'This product was not found in our database. Would you like to add it manually?',
        [
          {
            text: 'Cancel',
            onPress: () => setScanned(false),
            style: 'cancel',
          },
          {
            text: 'Add Manually',
            onPress: () => {
              router.replace('/nutrition/food-search' as any);
            },
          },
        ]
      );
    }
  };

  // Calculate nutrition based on quantity (nutrition is per 100g)
  const getCalculatedNutrition = () => {
    if (!scannedProduct) return null;
    const quantity = parseFloat(customQuantity) || 100;
    const multiplier = quantity / 100;
    return {
      calories: Math.round((scannedProduct.nutrition.calories || 0) * multiplier),
      protein: Math.round((scannedProduct.nutrition.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((scannedProduct.nutrition.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((scannedProduct.nutrition.fat || 0) * multiplier * 10) / 10,
    };
  };

  const adjustQuantity = (delta: number) => {
    const current = parseFloat(customQuantity) || 100;
    const newQuantity = Math.max(10, current + delta);
    setCustomQuantity(String(newQuantity));
  };

  const handleAddToLog = async () => {
    if (!scannedProduct) return;

    const quantity = parseFloat(customQuantity) || 100;

    try {
      // Pass the actual quantity in grams - nutrition is calculated per 100g internally
      await addFoodEntry(scannedProduct, selectedMeal, quantity);
      setShowProductModal(false);
      clearScannedProduct();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add food to log. Please try again.');
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setShowProductModal(false);
    clearScannedProduct();
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.permissionText}>
            Camera access is required to scan barcodes
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
        </Pressable>
        <Text style={styles.headerTitleLight}>Scan Barcode</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Scan Overlay */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.scanCorner, styles.topLeft]} />
            <View style={[styles.scanCorner, styles.topRight]} />
            <View style={[styles.scanCorner, styles.bottomLeft]} />
            <View style={[styles.scanCorner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanHint}>
            Position the barcode within the frame
          </Text>
        </View>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.text.inverse} />
            <Text style={styles.loadingText}>Looking up product...</Text>
          </View>
        )}
      </View>

      {/* Manual Entry Button */}
      <View style={styles.footer}>
        <Pressable
          style={styles.manualButton}
          onPress={() => router.replace('/nutrition/food-search' as any)}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary.orange} />
          <Text style={styles.manualButtonText}>Enter Manually</Text>
        </Pressable>
      </View>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleScanAgain}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Product Found</Text>
            <Pressable onPress={handleScanAgain} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
          </View>

          {scannedProduct && getCalculatedNutrition() && (
            <View style={styles.modalContent}>
              {/* Product Info */}
              <Card variant="elevated" style={styles.productCard}>
                <Text style={styles.productName}>{scannedProduct.name}</Text>
                {scannedProduct.brand && (
                  <Text style={styles.productBrand}>{scannedProduct.brand}</Text>
                )}

                {/* Quantity Input */}
                <View style={styles.quantitySection}>
                  <Text style={styles.quantityLabel}>
                    Quantity ({scannedProduct.servingUnit || 'g'}):
                  </Text>
                  <View style={styles.quantityControls}>
                    <Pressable
                      style={styles.quantityButton}
                      onPress={() => adjustQuantity(-25)}
                    >
                      <Ionicons name="remove" size={24} color={Colors.text.primary} />
                    </Pressable>

                    <TextInput
                      style={styles.quantityInput}
                      value={customQuantity}
                      onChangeText={setCustomQuantity}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <Text style={styles.quantityUnit}>{scannedProduct.servingUnit || 'g'}</Text>

                    <Pressable
                      style={styles.quantityButton}
                      onPress={() => adjustQuantity(25)}
                    >
                      <Ionicons name="add" size={24} color={Colors.text.primary} />
                    </Pressable>
                  </View>

                  {/* Quick quantity buttons */}
                  <View style={styles.quickQuantities}>
                    {[100, 150, 200, 250, 330].map((q) => (
                      <Pressable
                        key={q}
                        style={[
                          styles.quickQuantityButton,
                          customQuantity === String(q) && styles.quickQuantityButtonActive,
                        ]}
                        onPress={() => setCustomQuantity(String(q))}
                      >
                        <Text
                          style={[
                            styles.quickQuantityText,
                            customQuantity === String(q) && styles.quickQuantityTextActive,
                          ]}
                        >
                          {q}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Nutrition Info - calculated based on quantity */}
                <View style={styles.nutritionSection}>
                  <Text style={styles.nutritionTitle}>
                    Nutrition for {customQuantity}{scannedProduct.servingUnit || 'g'}:
                  </Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {getCalculatedNutrition()!.calories}
                      </Text>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {getCalculatedNutrition()!.protein}g
                      </Text>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {getCalculatedNutrition()!.carbs}g
                      </Text>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {getCalculatedNutrition()!.fat}g
                      </Text>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Meal Selection */}
              <Text style={styles.sectionTitle}>Add to:</Text>
              <View style={styles.mealOptions}>
                {MEAL_OPTIONS.map((meal) => (
                  <Pressable
                    key={meal.value}
                    style={[
                      styles.mealOption,
                      selectedMeal === meal.value && styles.mealOptionSelected,
                    ]}
                    onPress={() => setSelectedMeal(meal.value)}
                  >
                    <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                    <Text
                      style={[
                        styles.mealLabel,
                        selectedMeal === meal.value && styles.mealLabelSelected,
                      ]}
                    >
                      {meal.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Add Button */}
              <Button
                title="Add to Log"
                onPress={handleAddToLog}
                fullWidth
                loading={isLoading}
                style={styles.addButton}
              />

              <Pressable style={styles.scanAgainButton} onPress={handleScanAgain}>
                <Text style={styles.scanAgainText}>Scan Another</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  headerTitleLight: {
    ...Typography.h5,
    color: Colors.text.inverse,
  },
  headerSpacer: {
    width: 40,
  },
  permissionText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Camera
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary.orange,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanHint: {
    ...Typography.body,
    color: Colors.text.inverse,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.inverse,
  },

  // Footer
  footer: {
    padding: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing['2xl'],
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
  },
  manualButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary.orange,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: Layout.screenPaddingHorizontal,
  },

  // Product Card
  productCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  productName: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  productBrand: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  // Quantity Section
  quantitySection: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  quantityLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  quantityInput: {
    ...Typography.h3,
    color: Colors.text.primary,
    textAlign: 'center',
    minWidth: 80,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  quantityUnit: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  quickQuantities: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  quickQuantityButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  quickQuantityButtonActive: {
    backgroundColor: Colors.primary.orangeLight + '30',
    borderColor: Colors.primary.orange,
  },
  quickQuantityText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  quickQuantityTextActive: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },

  // Nutrition Section
  nutritionSection: {
    marginTop: Spacing.md,
  },
  nutritionTitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
  },
  nutritionValue: {
    ...Typography.h4,
    color: Colors.primary.orange,
  },
  nutritionLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },

  // Meal Selection
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  mealOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  mealOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealOptionSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orangeLight + '20',
  },
  mealEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  mealLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  mealLabelSelected: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },

  // Buttons
  addButton: {
    marginBottom: Spacing.md,
  },
  scanAgainButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  scanAgainText: {
    ...Typography.body,
    color: Colors.primary.tiffanyBlue,
    fontWeight: '600',
  },
});
