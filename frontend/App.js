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

const CartHydrator = () => {
  const dispatch = useDispatch();
  const context = useContext(AuthGlobal);

  const activeUserId = context.stateUser?.isAuthenticated
    ? context.stateUser?.user?.userId
    : 'guest';

  useEffect(() => {
    dispatch(loadCartFromDatabase(activeUserId || 'guest'));
  }, [dispatch, activeUserId]);

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
