import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Opens the device camera so the user can photograph a receipt.
 * Handles the permission flow and returns the captured image URI.
 */
export const useReceiptScanner = () => {
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const scanReceipt = useCallback(async () => {
    try {
      const { status, canAskAgain } =
        await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Needed',
          'CommonCents needs camera access to scan your receipts.',
          canAskAgain
            ? [{ text: 'OK' }]
            : [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true, // lets the user crop to the receipt
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Unable to open the camera. Please try again.');
    }
  }, []);

  const clearReceipt = useCallback(() => setReceiptUri(null), []);

  return { receiptUri, scanReceipt, clearReceipt };
};