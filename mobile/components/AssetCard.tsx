import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export enum CryptoAsset {
    BITCOIN = 'BITCOIN',
    ETHEREUM = 'ETHEREUM',
    SOLANA = 'SOLANA',
    USDC = 'USDC',
}

const ASSET_CONFIG = {
    [CryptoAsset.BITCOIN]: {
        icon: 'currency-bitcoin' as const,
        color: WalletColors.bitcoin,
        name: 'Bitcoin',
        symbol: 'BTC',
    },
    [CryptoAsset.ETHEREUM]: {
        icon: 'token' as const,
        color: WalletColors.ethereum,
        name: 'Ethereum',
        symbol: 'ETH',
    },
    [CryptoAsset.SOLANA]: {
        icon: 'bolt' as const,
        color: WalletColors.solana,
        name: 'Solana',
        symbol: 'SOL',
    },
    [CryptoAsset.USDC]: {
        icon: 'attach-money' as const,
        color: '#2775CA',
        name: 'USD Coin',
        symbol: 'USDC',
    },
};

interface AssetCardProps {
    asset: CryptoAsset;
    amount: string;
    value: string;
    changePercent: number;
    onPress?: () => void;
}

/**
 * Asset row card for the dashboard assets list.
 * Displays crypto icon, name, amount, USD value, and price change.
 */
export function AssetCard({
    asset,
    amount,
    value,
    changePercent,
    onPress,
}: AssetCardProps) {
    const config = ASSET_CONFIG[asset];
    const isPositive = changePercent >= 0;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Asset icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
                <MaterialIcons name={config.icon} size={24} color={config.color} />
            </View>

            {/* Asset name and amount */}
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{config.name}</Text>
                <Text style={styles.amount}>{amount} {config.symbol}</Text>
            </View>

            {/* Value and change */}
            <View style={styles.valueContainer}>
                <Text style={styles.value}>{value}</Text>
                <Text style={[styles.change, isPositive ? styles.changePositive : styles.changeNegative]}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: WalletColors.surfaceDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
    },
    name: {
        fontFamily: FontFamily.displayBold,
        fontSize: 16,
        color: WalletColors.white,
    },
    amount: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        color: WalletColors.textSecondary,
        marginTop: 2,
    },
    valueContainer: {
        alignItems: 'flex-end',
    },
    value: {
        fontFamily: FontFamily.displayBold,
        fontSize: 16,
        color: WalletColors.white,
    },
    change: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 12,
        marginTop: 2,
    },
    changePositive: {
        color: WalletColors.success,
    },
    changeNegative: {
        color: WalletColors.error,
    },
});
