import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
// Removed heavy chart library for better performance
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

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Start with the most critical API call
      const statsPromise = DashboardService.getMasterDashboardStats();
      
      // Show loading immediately, then load stats
      const statsData = await statsPromise;
      setStats(statsData);
      setLoading(false); // Show UI immediately after stats
      
      // Load remaining data without blocking UI
      const communitiesPromise = DashboardService.getCommunityStats();
      const trendsPromise = DashboardService.getOrderTrends(7);
      
      // Load these in background
      try {
        const [communitiesData, trendsData] = await Promise.all([
          communitiesPromise,
          trendsPromise,
        ]);
        setCommunities(communitiesData);
        setOrderTrends(trendsData);
      } catch (secondaryError) {
        console.warn('Secondary data loading failed:', secondaryError);
        // Don't fail the whole dashboard if secondary data fails
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

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

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const StatCard = React.memo(({ 
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
  ));

  // Simple chart visualization using bars
  const SimpleChart = React.memo(() => {
    if (!orderTrends.length) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>Loading trends...</Text>
        </View>
      );
    }

    const maxOrders = Math.max(...orderTrends.map(t => t.orders));
    
    return (
      <View style={styles.simpleChart}>
        {orderTrends.map((trend, index) => {
          const height = maxOrders > 0 ? (trend.orders / maxOrders) * 100 : 0;
          const date = new Date(trend.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          return (
            <View key={index} style={styles.chartBar}>
              <View style={styles.chartBarContainer}>
                <View 
                  style={[
                    styles.chartBarFill, 
                    { height: `${height}%` }
                  ]} 
                />
              </View>
              <Text style={styles.chartBarLabel}>{date}</Text>
              <Text style={styles.chartBarValue}>{trend.orders}</Text>
            </View>
          );
        })}
      </View>
    );
  });

  if (loading || !stats) {
    return (
      <View style={styles.container}>
        <Header title="Master Dashboard" subtitle="Platform Overview" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <SimpleChart />
        </Card>

        {/* Top Communities */}
        <Card style={styles.communitiesCard} padding={5}>
          <View style={styles.communitiesHeader}>
            <Text style={styles.communitiesTitle}>Top Communities</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {communities.length > 0 ? (
            communities.slice(0, 4).map((community, index) => (
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
            ))
          ) : (
            <View style={styles.communitiesPlaceholder}>
              <Text style={styles.communitiesPlaceholderText}>Loading communities...</Text>
            </View>
          )}
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

  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    marginVertical: theme.spacing[2],
  },

  chartPlaceholderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  communitiesPlaceholder: {
    paddingVertical: theme.spacing[6],
    alignItems: 'center',
  },

  communitiesPlaceholderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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

  simpleChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: theme.spacing[2],
    marginVertical: theme.spacing[4],
  },

  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: theme.spacing[1],
  },

  chartBarContainer: {
    height: 80,
    width: 20,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  chartBarFill: {
    width: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.radius.sm,
  },

  chartBarLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
    textAlign: 'center',
  },

  chartBarValue: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginTop: theme.spacing[1],
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