import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { DashboardService, DashboardStats, OrderTrend } from '../../services/dashboard';
import { CommunityStats } from '../../services/communities';

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [communities, setCommunities] = useState<CommunityStats[]>([]);
  const [orderTrends, setOrderTrends] = useState<OrderTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Only load dashboard data when auth is complete and user is available
    if (!authLoading && user) {
      console.log('👤 User authenticated, loading dashboard...');
      loadDashboardData();
    } else if (!authLoading && !user) {
      console.log('❌ No authenticated user found');
      setLoading(false);
    }
  }, [authLoading, user]);

  const loadDashboardData = async () => {
    try {
      const [statsData, communitiesData, trendsData] = await Promise.all([
        DashboardService.getMasterDashboardStats(),
        DashboardService.getCommunityStats(),
        DashboardService.getOrderTrends(7),
      ]);

      setStats(statsData);
      setCommunities(communitiesData);
      setOrderTrends(trendsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_community':
        navigation.navigate('Communities');
        break;
      case 'manage_vendors':
        navigation.navigate('Vendors');
        break;
      case 'view_reports':
        // Navigate to reports screen when implemented
        console.log('View Reports action');
        break;
      case 'settings':
        // Navigate to settings screen when implemented
        console.log('Settings action');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: keyof typeof Ionicons.glyphMap; 
    color: string;
    subtitle?: string;
  }) => (
    <Card style={styles.statCard} padding={4}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );

  const chartConfig = {
    backgroundColor: theme.colors.white,
    backgroundGradientFrom: theme.colors.white,
    backgroundGradientTo: theme.colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: theme.radius.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary[600],
    },
  };

  if (loading || !stats) {
    return (
      <View style={styles.container}>
        <Header title="Master Dashboard" subtitle="Platform Overview" />
        <View style={styles.loadingContainer}>
          <Text>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Master Dashboard" subtitle="Platform Overview" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Key Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Communities"
            value={stats.totalCommunities}
            icon="business"
            color={theme.colors.primary[600]}
          />
          <StatCard
            title="Active Vendors"
            value={stats.totalVendors}
            icon="storefront"
            color={theme.colors.secondary[600]}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon="people"
            color={theme.colors.success[600]}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            icon="bag"
            color={theme.colors.warning[600]}
          />
        </View>

        {/* Revenue & Performance */}
        <View style={styles.performanceGrid}>
          <Card style={styles.revenueCard} padding={5}>
            <View style={styles.revenueHeader}>
              <View>
                <Text style={styles.revenueTitle}>Total Revenue</Text>
                <Text style={styles.revenueValue}>
                  {formatCurrency(stats.totalRevenue)}
                </Text>
              </View>
              <View style={styles.revenueIcon}>
                <Ionicons 
                  name="trending-up" 
                  size={32} 
                  color={theme.colors.success[600]} 
                />
              </View>
            </View>
            <Text style={styles.revenueSubtitle}>
              +12.5% from last month
            </Text>
          </Card>

          <View style={styles.quickStats}>
            <Card style={styles.quickStatCard} padding={4}>
              <Text style={styles.quickStatValue}>{stats.activeUsers}</Text>
              <Text style={styles.quickStatLabel}>Active Users</Text>
              <Text style={styles.quickStatChange}>+5.2%</Text>
            </Card>
            
            <Card style={styles.quickStatCard} padding={4}>
              <Text style={styles.quickStatValue}>{stats.pendingOrders}</Text>
              <Text style={styles.quickStatLabel}>Pending Orders</Text>
              <Text style={[styles.quickStatChange, { color: theme.colors.warning[600] }]}>
                -2.1%
              </Text>
            </Card>
          </View>
        </View>

        {/* Order Trends Chart */}
        <Card style={styles.chartCard} padding={5}>
          <Text style={styles.chartTitle}>Order Trends (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: orderTrends.map(trend => 
                new Date(trend.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })
              ),
              datasets: [{
                data: orderTrends.map(trend => trend.orders),
              }],
            }}
            width={screenWidth - 60}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>

        {/* Top Communities */}
        <Card style={styles.communitiesCard} padding={5}>
          <View style={styles.communitiesHeader}>
            <Text style={styles.communitiesTitle}>Top Communities</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {communities.slice(0, 4).map((community, index) => (
            <View key={community.communityId} style={styles.communityItem}>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{community.communityName}</Text>
                <Text style={styles.communityStats}>
                  {community.vendorCount} vendors • {community.userCount} users
                </Text>
              </View>
              <View style={styles.communityRevenue}>
                <Text style={styles.communityRevenueValue}>
                  {formatCurrency(community.revenue)}
                </Text>
                <View style={styles.communityRank}>
                  <Text style={styles.communityRankText}>#{index + 1}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard} padding={5}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('add_community')}
            >
              <Ionicons 
                name="add-circle" 
                size={32} 
                color={theme.colors.primary[600]} 
              />
              <Text style={styles.actionButtonText}>Add Community</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('manage_vendors')}
            >
              <Ionicons 
                name="storefront" 
                size={32} 
                color={theme.colors.secondary[600]} 
              />
              <Text style={styles.actionButtonText}>Manage Vendors</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('view_reports')}
            >
              <Ionicons 
                name="analytics" 
                size={32} 
                color={theme.colors.success[600]} 
              />
              <Text style={styles.actionButtonText}>View Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('settings')}
            >
              <Ionicons 
                name="settings" 
                size={32} 
                color={theme.colors.warning[600]} 
              />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  content: {
    flex: 1,
    padding: theme.spacing[4],
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  
  statCard: {
    width: '48%',
    marginBottom: theme.spacing[3],
  },
  
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[2],
  },
  
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
  },
  
  statTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500' as const,
  },
  
  statSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  
  performanceGrid: {
    flexDirection: 'row',
    marginBottom: theme.spacing[4],
    gap: theme.spacing[3],
  },
  
  revenueCard: {
    flex: 2,
  },
  
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  
  revenueTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: '500' as const,
  },
  
  revenueValue: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[1],
  },
  
  revenueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  revenueSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success[600],
    fontWeight: '500' as const,
  },
  
  quickStats: {
    flex: 1,
    gap: theme.spacing[3],
  },
  
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  
  quickStatValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
  },
  
  quickStatLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[1],
  },
  
  quickStatChange: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success[600],
    fontWeight: '500' as const,
    marginTop: theme.spacing[1],
  },
  
  chartCard: {
    marginBottom: theme.spacing[4],
  },
  
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  
  chart: {
    marginVertical: theme.spacing[2],
    borderRadius: theme.radius.lg,
  },
  
  communitiesCard: {
    marginBottom: theme.spacing[4],
  },
  
  communitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  
  communitiesTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
  },
  
  viewAllButton: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: '500' as const,
  },
  
  communityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  
  communityInfo: {
    flex: 1,
  },
  
  communityName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
  },
  
  communityStats: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  
  communityRevenue: {
    alignItems: 'flex-end',
  },
  
  communityRevenueValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
  },
  
  communityRank: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    marginTop: theme.spacing[1],
  },
  
  communityRankText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
    fontWeight: '700' as const,
  },
  
  actionsCard: {
    marginBottom: theme.spacing[4],
  },
  
  actionsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  actionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing[3],
  },
  
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginTop: theme.spacing[2],
  },
  
  bottomSpacer: {
    height: theme.spacing[8],
  },
});

export default DashboardScreen;