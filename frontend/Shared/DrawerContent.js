import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

const DrawerContent = () => {
  const [active, setActive] = useState('');
  const navigation = useNavigation();

  const onClick = (route) => {
    setActive(route);
  };

  const DrawerItem = ({label, icon, onPress, isActive}) => (
    <TouchableOpacity 
      style={[styles.drawerItem, isActive && styles.activeItem]} 
      onPress={onPress}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={isActive ? '#4CAF50' : 'rgba(255,255,255,0.7)'} 
        style={styles.icon}
      />
      <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf" size={24} color="#4CAF50" />
        <Text style={styles.headerTitle}>Planterest</Text>
      </View>
      
      <View style={styles.itemsContainer}>
        <DrawerItem
          label="My Profile"
          icon="person-outline"
          onPress={() => navigation.navigate('User', {screen: 'User Profile'})}
          isActive={active === 'Profile'}
        />
        <DrawerItem
          label="My Orders"
          icon="bag-outline"
          onPress={() => navigation.navigate('User', {screen: 'My Orders'})}
          isActive={active === 'Orders'}
        />
        <DrawerItem
          label="Shopping Cart"
          icon="cart-outline"
          onPress={() => navigation.navigate('Cart')}
          isActive={active === 'Cart'}
        />
        <DrawerItem
          label="Plants"
          icon="leaf-outline"
          onPress={() => navigation.navigate('MainTabs')}
          isActive={active === 'Plants'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#45573c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  itemsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
    marginBottom: 5,
    borderRadius: 12,
  },
  activeItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  icon: {
    marginRight: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  activeLabel: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default DrawerContent;

