import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

const pendingNavigationActions = [];

const runOrQueue = (action) => {
  if (navigationRef.isReady()) {
    action();
    return;
  }

  pendingNavigationActions.push(action);
};

export const flushNavigationQueue = () => {
  while (navigationRef.isReady() && pendingNavigationActions.length > 0) {
    const nextAction = pendingNavigationActions.shift();

    try {
      nextAction();
    } catch (error) {
      console.log('Failed to run queued navigation action', error?.message || error);
    }
  }
};

export const navigate = (name, params) => {
  runOrQueue(() => navigationRef.navigate(name, params));
};

export const navigateToUserLogin = () => {
  navigate('MainTabs', {
    screen: 'User',
    params: {
      screen: 'Login',
    },
  });
};

export const navigateToOrderDetails = ({ order, isCustomer = true }) => {
  if (!order) {
    return;
  }

  navigate('MainTabs', {
    screen: 'User',
    params: {
      screen: 'Order Details',
      params: { order, isCustomer },
    },
  });
};
