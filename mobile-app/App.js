import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

// CONFIGURATION: Set your deployed web URL or development server IP here
// In Expo Go dev mode, a physical device cannot resolve localhost.
// Use 'npx expo start --tunnel' or use your local machine's IP (e.g., http://192.168.1.50:5173).
const DEFAULT_GAME_URL = 'http://localhost:5000'; // Express production URL (or local Vite url http://localhost:5173)

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef(null);

  // Handle messages sent from HTML5 Canvas Web App
  const handleMessage = async (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'HAPTIC') {
        switch (message.effect) {
          case 'impactLight':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'impactMedium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'impactHeavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          default:
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (e) {
      console.warn('Failed to process webview bridge message:', e);
    }
  };

  const reloadGame = () => {
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#06000F" />
      
      {!hasError ? (
        <WebView
          ref={webViewRef}
          source={{ uri: DEFAULT_GAME_URL }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          onHttpError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          onMessage={handleMessage}
          scalesPageToFit={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          allowsBackForwardNavigationGestures={false}
          // Prevent pinching and double-tap zoom triggers
          textZoom={100}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>📡 CONNECTION LOST</Text>
          <Text style={styles.errorText}>
            Unable to connect to the Space Escaper mainframe. Please check your internet connection or verify the server host is active.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={reloadGame}>
            <Text style={styles.retryText}>RETRY TRANSMISSION 🚀</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00f0ff" />
          <Text style={styles.loadingText}>BOOTING PROPULSION ENGINES...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06000F',
  },
  webview: {
    flex: 1,
    backgroundColor: '#06000F',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#06000F',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: '#00f0ff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#06000F',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 15,
  },
  errorText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    borderWidth: 2,
    borderColor: '#00f0ff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1.5,
  },
});
