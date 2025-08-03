import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import JoinCommunityScreen from '../screens/auth/JoinCommunityScreen';

import UserHomeScreen from '../screens/user/HomeScreen';
import VendorListScreen from '../screens/user/VendorListScreen';
import ProductListScreen from '../screens/user/ProductListScreen';
import OrderHistoryScreen from '../screens/user/OrderHistoryScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import AdminPartnersScreen from '../screens/admin/PartnersScreen';

import PartnerOrdersScreen from '../screens/partner/OrdersScreen';
import PartnerProfileScreen from '../screens/partner/ProfileScreen';

import MasterDashboardScreen from '../screens/master/DashboardScreen';
import MasterCommunitiesScreen from '../screens/master/CommunitiesScreen';
import MasterVendorsScreen from '../screens/master/VendorsScreen';

import { UserRole } from '../types';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="JoinCommunity" component={JoinCommunityScreen} />
  </Stack.Navigator>
);

const UserTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Home" 
      component={UserHomeScreen}
      options={{ title: 'Home' }}
    />
    <Tab.Screen 
      name="Vendors" 
      component={VendorListScreen}
      options={{ title: 'Services' }}
    />
    <Tab.Screen 
      name="Orders" 
      component={OrderHistoryScreen}
      options={{ title: 'Orders' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Dashboard" 
      component={AdminDashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Orders" 
      component={AdminOrdersScreen}
      options={{ title: 'Orders' }}
    />
    <Tab.Screen 
      name="Partners" 
      component={AdminPartnersScreen}
      options={{ title: 'Partners' }}
    />
  </Tab.Navigator>
);

const PartnerTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Orders" 
      component={PartnerOrdersScreen}
      options={{ title: 'My Orders' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={PartnerProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

const MasterTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Dashboard" 
      component={MasterDashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Communities" 
      component={MasterCommunitiesScreen}
      options={{ title: 'Communities' }}
    />
    <Tab.Screen 
      name="Vendors" 
      component={MasterVendorsScreen}
      options={{ title: 'Vendors' }}
    />
  </Tab.Navigator>
);

const MainStack = ({ userRole }: { userRole: UserRole }) => {
  let TabComponent;
  
  switch (userRole) {
    case 'master':
      TabComponent = MasterTabs;
      break;
    case 'admin':
      TabComponent = AdminTabs;
      break;
    case 'partner':
      TabComponent = PartnerTabs;
      break;
    default:
      TabComponent = UserTabs;
  }

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={TabComponent} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Loading component
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainStack userRole={user.role} />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};