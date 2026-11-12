import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { parseReceiptText, ParsedReceipt } from './receiptParser';

const OCR_API_KEY = 'K8464431973022788957'; //API key here (process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY) or key directly
const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';

const recognizeText = async (uri: string): Promise<string> => {
  if (!OCR_API_KEY) {
    throw new Error('Missing OCR.space API key.');
  }

  // Shrink the photo (free tier limit is 1 MB) and get it back as base64
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!resized.base64) {
    throw new Error('Could not prepare the photo for scanning.');
  }

  const fields: Record<string, string> = {
    base64Image: `data:image/jpeg;base64,${resized.base64}`,
    language: 'eng',
    OCREngine: '2',
    scale: 'true',
    isTable: 'true',
  };

  const body = Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  const response = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    headers: {
      apikey: OCR_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`OCR service returned status ${response.status}.`);
  }

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    const message = Array.isArray(data.ErrorMessage)
      ? data.ErrorMessage.join(' ')
      : String(data.ErrorMessage ?? 'Unknown OCR error.');
    throw new Error(message);
  }

  return data.ParsedResults?.[0]?.ParsedText ?? '';
};

/**
 * Opens the camera, sends the photo to OCR.space, and hands the parsed
 * fields (merchant, total, category) to `onParsed`.
 */
export const useReceiptScanner = (onParsed: (data: ParsedReceipt) => void) => {
  const [isScanning, setIsScanning] = useState(false);

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
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) return;

      setIsScanning(true);
      const text = await recognizeText(result.assets[0].uri);
      const parsed = parseReceiptText(text);

      if (!parsed.amount && !parsed.title) {
        Alert.alert(
          'Could Not Read Receipt',
          'Try again with better lighting and the receipt flat, or enter the expense manually.',
        );
        return;
      }

      onParsed(parsed);
    } catch (error) {
      console.error('Receipt scan error:', error);
      Alert.alert('Scan Failed', error instanceof Error ? error.message : String(error));
    } finally {
      setIsScanning(false);
    }
  }, [onParsed]);

  return { scanReceipt, isScanning };
};