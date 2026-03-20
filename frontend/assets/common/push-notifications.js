import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from 'axios';
import baseURL from './baseurl';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerAndSyncPushToken = async ({ userId, authToken }) => {
  if (!userId || !authToken || !Device.isDevice) {
    return null;
  }

  // Expo Go no longer supports Android remote push in newer SDKs.
  if (Constants.appOwnership === 'expo') {
    console.log('Push token sync skipped in Expo Go. Use a development build for remote notifications.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
    });
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
  let pushToken = null;

  try {
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    pushToken = tokenResponse?.data;
  } catch (error) {
    console.log('Failed to get Expo push token', error?.message || error);
    return null;
  }

  if (!pushToken) {
    return null;
  }

  await axios.put(
    `${baseURL}users/${userId}/push-token`,
    { expoPushToken: pushToken },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  return pushToken;
};

export const removePushTokenOnServer = async ({ userId, authToken }) => {
  if (!userId || !authToken) {
    return;
  }

  await axios.delete(`${baseURL}users/${userId}/push-token`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
};
