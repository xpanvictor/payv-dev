import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { BalanceCard } from '@/components/BalanceCard';
import { AssetCard, CryptoAsset } from '@/components/AssetCard';
import { TransactionCard, TransactionType, TransactionStatus } from '@/components/TransactionCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * Wallet Dashboard screen.
 * Main screen showing balance, assets, and recent activity.
 */
export default function DashboardScreen() {
  const handleCopyAddress = () => {
    // Clipboard copy logic will be implemented
  };

  const handleToggleVisibility = () => {
    // Toggle balance visibility
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBME_VJFdxdW4wg2pTCgworFxsGKsFF9PKrsKr3cCPoSI6ut2mE29e20LwIjaQ2hBbCNZ3-I_6SmbRFcC-GxRt1OQ9HqVlG737Po5s9laIPOyXII21raCuptcP-iIo3R1pmHXtiIl1dVMOx-2fJkQZ8AmJ2Cfm8fT-kbPd-z6VnWCGEa0I4bdUbfsgjE8z0SivU3yC3ezsyi0hEGewODiQTuCeGX-gE8oN0Gu1IVD1lJJa3d-qLQ6PZrQEvicSgcaIoVsutZVpWwyc' }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View>
            <Text style={styles.walletLabel}>My Wallet</Text>
            <TouchableOpacity style={styles.accountSelector}>
              <Text style={styles.accountName}>Main Account</Text>
              <MaterialIcons name="expand-more" size={16} color={WalletColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.qrButton}>
          <MaterialIcons name="qr-code-scanner" size={24} color={WalletColors.white} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <BalanceCard
          balance="$24,562.34"
          changePercent={5.2}
          changeAmount="$1,240.50"
          walletAddress="0x71...8f9"
          onCopyAddress={handleCopyAddress}
          onToggleVisibility={handleToggleVisibility}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.sendButton} activeOpacity={0.85}>
            <LinearGradient
              colors={[WalletColors.primary, '#4f46e5']}
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons
                  name="arrow-upward"
                  size={24}
                  color={WalletColors.white}
                  style={{ transform: [{ rotate: '-45deg' }] }}
                />
              </View>
              <Text style={styles.actionButtonText}>Send</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.receiveButton} activeOpacity={0.85}>
            <View style={styles.actionButtonOutline}>
              <View style={styles.actionIconContainerOutline}>
                <MaterialIcons
                  name="arrow-upward"
                  size={24}
                  color={WalletColors.primary}
                  style={{ transform: [{ rotate: '135deg' }] }}
                />
              </View>
              <Text style={styles.actionButtonTextOutline}>Receive</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Assets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assets</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.assetsList}>
            <AssetCard
              asset={CryptoAsset.BITCOIN}
              amount="0.45"
              value="$12,000.00"
              changePercent={2.1}
            />
            <AssetCard
              asset={CryptoAsset.ETHEREUM}
              amount="4.2"
              value="$8,500.42"
              changePercent={-0.8}
            />
            <AssetCard
              asset={CryptoAsset.SOLANA}
              amount="145.2"
              value="$4,061.92"
              changePercent={12.4}
            />
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <TransactionCard
              type={TransactionType.SENT}
              title="Sent to 0x3d..."
              subtitle="2 mins ago"
              amount="-0.5 ETH"
              status={TransactionStatus.COMPLETED}
            />
            <TransactionCard
              type={TransactionType.RECEIVED}
              title="Received"
              subtitle="1 hr ago • From Coinbase"
              amount="+100 USDC"
              status={TransactionStatus.COMPLETED}
              isCredit
            />
            <TransactionCard
              type={TransactionType.SWAP}
              title="Swap ETH to BTC"
              subtitle="5 hrs ago"
              amount="0.1 ETH"
              status={TransactionStatus.PENDING}
              showBorder={false}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WalletColors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: WalletColors.backgroundDark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(55, 19, 236, 0.3)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: WalletColors.success,
    borderWidth: 2,
    borderColor: WalletColors.backgroundDark,
  },
  walletLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: WalletColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountName: {
    fontFamily: FontFamily.displayBold,
    fontSize: 14,
    color: WalletColors.white,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WalletColors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  sendButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: WalletColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  receiveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonOutline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
    backgroundColor: WalletColors.surfaceDark,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  actionIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 6,
    borderRadius: 20,
  },
  actionIconContainerOutline: {
    backgroundColor: 'rgba(55, 19, 236, 0.2)',
    padding: 6,
    borderRadius: 20,
  },
  actionButtonText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 14,
    color: WalletColors.white,
  },
  actionButtonTextOutline: {
    fontFamily: FontFamily.displayBold,
    fontSize: 14,
    color: WalletColors.white,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: 18,
    color: WalletColors.white,
  },
  seeAllButton: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: WalletColors.primary,
  },
  assetsList: {
    gap: 12,
  },
  activityContainer: {
    marginTop: 12,
    backgroundColor: WalletColors.surfaceDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
});
