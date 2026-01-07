import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export enum TransactionType {
    SENT = 'SENT',
    RECEIVED = 'RECEIVED',
    SWAP = 'SWAP',
}

export enum TransactionStatus {
    COMPLETED = 'COMPLETED',
    PENDING = 'PENDING',
    FAILED = 'FAILED',
}

const TYPE_CONFIG = {
    [TransactionType.SENT]: {
        icon: 'arrow-upward' as const,
        iconRotation: -45,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        iconColor: WalletColors.white,
    },
    [TransactionType.RECEIVED]: {
        icon: 'arrow-upward' as const,
        iconRotation: 135,
        backgroundColor: 'rgba(55, 19, 236, 0.1)',
        iconColor: WalletColors.primary,
    },
    [TransactionType.SWAP]: {
        icon: 'swap-horiz' as const,
        iconRotation: 0,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        iconColor: '#a78bfa',
    },
};

const STATUS_CONFIG = {
    [TransactionStatus.COMPLETED]: {
        label: 'Completed',
        color: WalletColors.textSecondary,
    },
    [TransactionStatus.PENDING]: {
        label: 'Pending',
        color: WalletColors.warning,
    },
    [TransactionStatus.FAILED]: {
        label: 'Failed',
        color: WalletColors.error,
    },
};

interface TransactionCardProps {
    type: TransactionType;
    title: string;
    subtitle: string;
    amount: string;
    status: TransactionStatus;
    isCredit?: boolean;
    onPress?: () => void;
    showBorder?: boolean;
}

/**
 * Transaction row card for recent activity section.
 * Displays transaction type icon, details, amount, and status.
 */
export function TransactionCard({
    type,
    title,
    subtitle,
    amount,
    status,
    isCredit = false,
    onPress,
    showBorder = true,
}: TransactionCardProps) {
    const typeConfig = TYPE_CONFIG[type];
    const statusConfig = STATUS_CONFIG[status];

    return (
        <TouchableOpacity
            style={[styles.container, showBorder && styles.containerBorder]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Transaction type icon */}
            <View style={[styles.iconContainer, { backgroundColor: typeConfig.backgroundColor }]}>
                <MaterialIcons
                    name={typeConfig.icon}
                    size={24}
                    color={typeConfig.iconColor}
                    style={{ transform: [{ rotate: `${typeConfig.iconRotation}deg` }] }}
                />
            </View>

            {/* Transaction details */}
            <View style={styles.infoContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {/* Amount and status */}
            <View style={styles.valueContainer}>
                <Text style={[styles.amount, isCredit && styles.amountCredit]}>
                    {isCredit ? '+' : ''}{amount}
                </Text>
                <Text style={[styles.status, { color: statusConfig.color }]}>
                    {statusConfig.label}
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
    },
    containerBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    title: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 14,
        color: WalletColors.white,
    },
    subtitle: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        color: WalletColors.textSecondary,
        marginTop: 2,
    },
    valueContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontFamily: FontFamily.displayBold,
        fontSize: 14,
        color: WalletColors.white,
    },
    amountCredit: {
        color: WalletColors.success,
    },
    status: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        marginTop: 2,
    },
});
