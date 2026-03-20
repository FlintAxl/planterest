import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect } from 'react';
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

const CartHydrator = () => {
  const dispatch = useDispatch();
  const context = useContext(AuthGlobal);

  const activeUserId = context.stateUser?.isAuthenticated
    ? context.stateUser?.user?.userId
    : 'guest';

  useEffect(() => {
    dispatch(loadCartFromDatabase(activeUserId || 'guest'));
  }, [dispatch, activeUserId]);

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

  return null;
};

export default function App() {
  return (
    <Auth>
      <Provider store={store}>
        <NavigationContainer>
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
