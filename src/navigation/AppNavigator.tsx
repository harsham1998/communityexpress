import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import JoinCommunityScreen from '../screens/auth/JoinCommunityScreen';

import UserHomeScreen from '../screens/user/HomeScreen';
import UserVendorsScreen from '../screens/user/UserVendorsScreen';
import ProductListScreen from '../screens/user/ProductListScreen';
import OrderHistoryScreen from '../screens/user/OrderHistoryScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';

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
  <Tab.Navigator 
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'UserHome') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'UserVendors') {
          iconName = focused ? 'storefront' : 'storefront-outline';
        } else if (route.name === 'OrderHistory') {
          iconName = focused ? 'receipt' : 'receipt-outline';
        } else if (route.name === 'UserProfile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'ellipse-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary[600],
      tabBarInactiveTintColor: theme.colors.gray[400],
      tabBarStyle: {
        backgroundColor: theme.colors.white,
        borderTopColor: theme.colors.border.light,
      },
    })}
  >
    <Tab.Screen 
      name="UserHome" 
      component={UserHomeScreen}
      options={{ title: 'Home' }}
    />
    <Tab.Screen 
      name="UserVendors" 
      component={UserVendorsScreen}
      options={{ title: 'Vendors' }}
    />
    <Tab.Screen 
      name="OrderHistory" 
      component={OrderHistoryScreen}
      options={{ title: 'Orders' }}
    />
    <Tab.Screen 
      name="UserProfile" 
      component={UserProfileScreen}
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Main" 
        component={TabComponent} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="VendorDetails" component={ProductListScreen} />
      <Stack.Screen name="OrderDetails" component={ProductListScreen} />
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