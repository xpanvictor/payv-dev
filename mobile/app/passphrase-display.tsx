import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getMnemonicWords } from '@/services/walletService';

const WORDS_PER_ROW = 3;
const COPY_FEEDBACK_DURATION_MS = 2000;

interface WordCardProps {
    index: number;
    word: string;
}

function WordCard({ index, word }: WordCardProps) {
    const wordNumber = index + 1;
    return (
        <View style={styles.wordCard}>
            <Text style={styles.wordNumber}>{wordNumber}</Text>
            <Text style={styles.wordText}>{word}</Text>
        </View>
    );
}

/**
 * Displays the 12-word recovery passphrase after wallet creation.
 * Users must save this phrase before proceeding — it won't be shown again.
 */
export default function PassphraseDisplayScreen() {
    const { mnemonic, address } = useLocalSearchParams<{ mnemonic: string; address: string }>();
    const [copied, setCopied] = useState(false);

    const words = mnemonic ? getMnemonicWords(mnemonic) : [];

    const handleCopy = async () => {
        if (!mnemonic) return;

        await Clipboard.setStringAsync(mnemonic);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, COPY_FEEDBACK_DURATION_MS);
    };

    const handleContinue = () => {
        if (!mnemonic || !address) {
            Alert.alert('Error', 'Wallet data is missing. Please try again.');
            router.back();
            return;
        }

        router.push({
            pathname: '/passphrase-confirm',
            params: { mnemonic, address },
        } as any);
    };

    const handleBack = () => {
        Alert.alert(
            'Are you sure?',
            'If you go back, you will need to create a new wallet.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Go Back', style: 'destructive', onPress: () => router.back() },
            ]
        );
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={WalletColors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recovery Phrase</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Warning Banner */}
                    <View style={styles.warningBanner}>
                        <MaterialIcons name="warning" size={20} color={WalletColors.warning} />
                        <Text style={styles.warningText}>
                            Write these words down in order. You won't see them again.
                        </Text>
                    </View>

                    {/* Word Grid */}
                    <View style={styles.wordGrid}>
                        {words.map((word, index) => (
                            <WordCard key={index} index={index} word={word} />
                        ))}
                    </View>

                    {/* Copy Button */}
                    <TouchableOpacity
                        style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                        onPress={handleCopy}
                    >
                        <MaterialIcons
                            name={copied ? 'check' : 'content-copy'}
                            size={18}
                            color={copied ? WalletColors.success : WalletColors.textSecondary}
                        />
                        <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
                            {copied ? 'Copied!' : 'Copy to clipboard'}
                        </Text>
                    </TouchableOpacity>

                    {/* Security Tips */}
                    <View style={styles.tipsContainer}>
                        <Text style={styles.tipsTitle}>Security Tips</Text>
                        <View style={styles.tipRow}>
                            <MaterialIcons name="check-circle" size={16} color={WalletColors.success} />
                            <Text style={styles.tipText}>Write it down on paper</Text>
                        </View>
                        <View style={styles.tipRow}>
                            <MaterialIcons name="check-circle" size={16} color={WalletColors.success} />
                            <Text style={styles.tipText}>Store in a secure location</Text>
                        </View>
                        <View style={styles.tipRow}>
                            <MaterialIcons name="cancel" size={16} color={WalletColors.error} />
                            <Text style={styles.tipText}>Never share with anyone</Text>
                        </View>
                        <View style={styles.tipRow}>
                            <MaterialIcons name="cancel" size={16} color={WalletColors.error} />
                            <Text style={styles.tipText}>Don't store in screenshots</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.actions}>
                    <PrimaryButton
                        title="I've Saved My Phrase"
                        onPress={handleContinue}
                        icon="arrow-forward"
                    />
                    <SecondaryButton
                        title="Go Back"
                        onPress={handleBack}
                    />
                </View>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: FontFamily.displayBold,
        fontSize: 18,
        color: WalletColors.white,
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    warningText: {
        flex: 1,
        fontFamily: FontFamily.bodyMedium,
        fontSize: 14,
        color: WalletColors.warning,
        lineHeight: 20,
    },
    wordGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    wordCard: {
        width: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(30, 25, 51, 0.8)',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    wordNumber: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        color: WalletColors.textSecondary,
        minWidth: 16,
    },
    wordText: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 14,
        color: WalletColors.white,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 10,
        backgroundColor: 'rgba(30, 25, 51, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    copyButtonSuccess: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    copyButtonText: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 14,
        color: WalletColors.textSecondary,
    },
    copyButtonTextSuccess: {
        color: WalletColors.success,
    },
    tipsContainer: {
        backgroundColor: 'rgba(30, 25, 51, 0.5)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    tipsTitle: {
        fontFamily: FontFamily.bodyBold,
        fontSize: 14,
        color: WalletColors.white,
        marginBottom: 12,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    tipText: {
        fontFamily: FontFamily.body,
        fontSize: 13,
        color: WalletColors.textSecondary,
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        gap: 12,
    },
});
