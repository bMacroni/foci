import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { notificationsAPI } from './api';
// import PushNotification from 'react-native-push-notification'; // A popular library for local notifications and badge count

class NotificationService {
  private setBadgeCount(count: number) {
    // This is where you would integrate with a library like react-native-push-notification
    // or another library to set the app icon badge count.
    // e.g., PushNotification.setApplicationIconBadgeNumber(count);
    console.log(`Setting badge count to: ${count}`);
  }

  private async updateBadgeCount() {
    try {
      // Import auth service to check authentication status
      const { authService } = await import('./auth');
      
      // Only try to update badge count if user is authenticated
      if (!authService.isAuthenticated()) {
        console.log('Skipping badge count update - user not authenticated');
        return;
      }

      const count = await notificationsAPI.getUnreadCount();
      this.setBadgeCount(count);
    } catch (error) {
      // Only log error if it's not an authentication issue
      if (error instanceof Error && !error.message.includes('authentication') && !error.message.includes('not logged in')) {
        console.error('Failed to update badge count', error);
      }
    }
  }

  async requestUserPermission() {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        // Note: FCM token registration moved to backend-only approach
        console.log('Notification permissions requested for Android');
      } else if (Platform.OS === 'ios') {
        // iOS notification permissions will be handled by the backend push notification system
        console.log('iOS notification permissions will be handled by backend');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }

  // FCM token handling moved to backend-only approach
  // The backend will handle device token registration through its own FCM service
  async getFcmToken() {
    console.log('FCM token handling moved to backend-only approach');
    // This method is kept for compatibility but functionality moved to backend
  }

  async registerTokenWithBackend(token: string) {
    try {
      // Import auth service to check authentication status
      const { authService } = await import('./auth');
      
      // Only try to register token if user is authenticated
      if (!authService.isAuthenticated()) {
        console.log('Skipping device token registration - user not authenticated');
        return;
      }

      await notificationsAPI.registerDeviceToken(token, Platform.OS);
      console.log('Device token registered with backend successfully');
    } catch (error) {
      // Only log error if it's not an authentication issue
      if (error instanceof Error && !error.message.includes('authentication') && !error.message.includes('not logged in')) {
        console.error('Error registering device token with backend', error);
      }
    }
  }

  // Public method to manually update badge count (can be called after authentication)
  public async refreshBadgeCount() {
    await this.updateBadgeCount();
  }

  initialize() {
    try {
      this.requestUserPermission();
      this.updateBadgeCount(); // Initial count

      // Firebase messaging removed - using backend-only approach
      console.log('Notification service initialized with backend-only approach');
      console.log('Push notifications will be handled by the backend FCM service');
      
    } catch (error) {
      console.error('Notification service initialization failed:', error);
      console.log('Continuing without push notifications...');
    }
  }
}

export const notificationService = new NotificationService();
