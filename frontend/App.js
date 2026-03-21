import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProductContainer from './Screeens/Product/ProductContainer';
import Header from './Shared/Header';
import { NavigationContainer } from '@react-navigation/native'
import Main from './Navigators/Main';
import { Provider, useDispatch } from 'react-redux';
import store from './Redux/store';
import Toast from 'react-native-toast-message';
import Auth from './Context/Store/Auth';
import DrawerNavigator from './Navigators/DrawerNavigator';
import { loadCartFromDatabase } from './Redux/Actions/cartActions';
import AuthGlobal from './Context/Store/AuthGlobal';
import { getAuthToken } from './assets/common/token-storage';
import { registerAndSyncPushToken } from './assets/common/push-notifications';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import baseURL from './assets/common/baseurl';
import {
  flushNavigationQueue,
  navigateToOrderDetails,
  navigateToUserLogin,
  navigationRef,
} from './Navigators/navigationRef';

const CartHydrator = () => {
  const dispatch = useDispatch();
  const context = useContext(AuthGlobal);
  const stateUserRef = useRef(context.stateUser);
  const handledNotificationIdsRef = useRef(new Set());

  const activeUserId = context.stateUser?.isAuthenticated
    ? context.stateUser?.user?.userId
    : 'guest';

  useEffect(() => {
    dispatch(loadCartFromDatabase(activeUserId || 'guest'));
  }, [dispatch, activeUserId]);

  useEffect(() => {
    stateUserRef.current = context.stateUser;
  }, [context.stateUser]);

  useEffect(() => {
    const syncPushToken = async () => {
      if (context.stateUser?.isAuthenticated !== true) {
        return;
      }

      const userId = context.stateUser?.user?.userId;
      if (!userId) {
        return;
      }

      try {
        const authToken = await getAuthToken();
        await registerAndSyncPushToken({ userId, authToken });
      } catch (error) {
        console.log('Push token registration failed', error?.message || error);
      }
    };

    syncPushToken();
  }, [context.stateUser?.isAuthenticated, context.stateUser?.user?.userId]);

  useEffect(() => {
    const openOrderDetailsFromNotification = async (response) => {
      try {
        const notificationId = response?.notification?.request?.identifier;

        if (notificationId && handledNotificationIdsRef.current.has(notificationId)) {
          return;
        }

        if (notificationId) {
          handledNotificationIdsRef.current.add(notificationId);
        }

        const data = response?.notification?.request?.content?.data || {};
        const orderId = data?.orderId ? String(data.orderId) : null;
        const targetScreen = data?.screen ? String(data.screen) : null;

        if (!orderId) {
          return;
        }

        if (targetScreen && targetScreen !== 'Order Details') {
          return;
        }

        if (stateUserRef.current?.isAuthenticated !== true) {
          navigateToUserLogin();
          return;
        }

        const authToken = await getAuthToken();

        if (!authToken) {
          navigateToUserLogin();
          return;
        }

        const orderResponse = await axios.get(`${baseURL}orders/${orderId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!orderResponse?.data) {
          return;
        }

        navigateToOrderDetails({ order: orderResponse.data, isCustomer: true });
      } catch (error) {
        console.log('Failed to process notification tap', error?.message || error);
      }
    };

    const listenerSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        openOrderDetailsFromNotification(response);
      }
    );

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          openOrderDetailsFromNotification(response);
        }
      })
      .catch((error) => {
        console.log('Failed to read launch notification response', error?.message || error);
      });

    return () => {
      listenerSubscription.remove();
    };
  }, []);

  return null;
};

export default function App() {
  return (
    <Auth>
      <Provider store={store}>
        <NavigationContainer ref={navigationRef} onReady={flushNavigationQueue}>
          <CartHydrator />

          <Header />
          {/* <ProductContainer /> */}
          {/* <Main /> */}
          <DrawerNavigator />
          <Toast />

        </NavigationContainer>
      </Provider>
    </Auth>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
