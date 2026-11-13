import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { parseReceiptText, ParsedReceipt } from './receiptParser';

// Add OCR.space API key to OCR_API_KEY = ''
const OCR_API_KEY = 'K8464431973022788957';
const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';

// Photo sent to OCR.space to be parsed. Text string returned.
const recognizeText = async (uri: string): Promise<string> => {
  if (!OCR_API_KEY) {
    throw new Error('Missing API key.');
  }

// Resize image so within OCR.space free size limit. 
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  
  if (!resized.base64) {
    throw new Error('Photo could not be converted to base64');
  }

  // Build form data for OCR.space API request
  const fields: Record<string, string> = {
    base64Image: `data:image/jpeg;base64,${resized.base64}`,
    language: 'eng',
    OCREngine: '2',
    scale: 'true',
    isTable: 'true',
  };

  // Convert fields to URL-encoded string for fetch request
  const body = Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  // Send request to OCR.space API
  const response = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    headers: {
      apikey: OCR_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  
  if (!response.ok) {
    throw new Error(`OCR status ${response.status}.`);
  }

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(String(data.ErrorMessage ?? 'Unknown error.'));
  }

  return data.ParsedResults?.[0]?.ParsedText ?? '';
};

// scanReceipt called on button press. Opens camera, takes photo, sends to OCR.space, parses text, and returns parsed data.
export const useReceiptScanner = (onParsed: (data: ParsedReceipt) => void) => {
  const [isScanning, setIsScanning] = useState(false);

  const scanReceipt = async () => {
    try {
      // Request camera use from device
      const { status, canAskAgain } =
        await ImagePicker.requestCameraPermissionsAsync();

      // If permission denied, show alert and return
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Denied',
          'Application needs camera to scan receipt.',
          canAskAgain
            ? [{ text: 'OK' }]
            : [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }

      // Opens camera and takes photo. Returns URI of photo.
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) return;

      // Scan text from photo
      setIsScanning(true);
      const text = await recognizeText(result.assets[0].uri);

      // Extract the merchant name, total, items, etc. from scanned text
      const parsed = parseReceiptText(text);

      // If no title or amount found, show alert and return
      if (!parsed.amount && !parsed.title) {
        Alert.alert(
          'Could Not Read Receipt',
          'Try taking photo again',
        );
        return;
      }
      
      onParsed(parsed);
    } catch (error) {
      console.error('Receipt scan error:', error);
      Alert.alert('Scan Failed', error instanceof Error ? error.message : String(error));
    } finally {
      // Re-enables scan button
      setIsScanning(false);
    }
  };

  return { scanReceipt, isScanning };
};