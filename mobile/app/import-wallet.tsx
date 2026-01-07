import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { importWallet, saveWallet, isValidMnemonic } from '@/services/walletService';

const MNEMONIC_WORD_COUNT = 12;

/**
 * Import wallet screen.
 * Allows users to restore an existing wallet using a 12-word mnemonic phrase.
 */
export default function ImportWalletScreen() {
    const [phrase, setPhrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wordCount = phrase
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

    const handleImport = async () => {
        setError(null);

        if (wordCount !== MNEMONIC_WORD_COUNT) {
            setError(`Please enter all ${MNEMONIC_WORD_COUNT} words. You entered ${wordCount}.`);
            return;
        }

        if (!isValidMnemonic(phrase)) {
            setError('Invalid recovery phrase. Please check your words and try again.');
            return;
        }

        setLoading(true);
        try {
            const wallet = importWallet(phrase);
            await saveWallet(wallet);

            // Navigate to PIN setup
            router.replace('/setup-pin' as any);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to import wallet.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (phrase.length > 0) {
            Alert.alert(
                'Discard Changes?',
                'Your entered phrase will be lost.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                ]
            );
        } else {
            router.back();
        }
    };

    const handlePaste = async () => {
        // Platform-agnostic paste would require expo-clipboard
        // For now, users can long-press the text input
        Alert.alert('Tip', 'Long-press in the text field and select "Paste" to paste your phrase.');
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={WalletColors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Import Wallet</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Instructions */}
                    <View style={styles.instructions}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="restore" size={32} color={WalletColors.primary} />
                        </View>
                        <Text style={styles.title}>Restore Your Wallet</Text>
                        <Text style={styles.subtitle}>
                            Enter your 12-word recovery phrase to import your existing wallet.
                        </Text>
                    </View>

                    {/* Phrase Input */}
                    <View style={styles.inputContainer}>
                        <View style={styles.inputHeader}>
                            <Text style={styles.inputLabel}>Recovery Phrase</Text>
                            <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
                                <MaterialIcons name="content-paste" size={16} color={WalletColors.primary} />
                                <Text style={styles.pasteText}>Paste</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[
                                styles.phraseInput,
                                error && styles.phraseInputError,
                            ]}
                            value={phrase}
                            onChangeText={(text) => {
                                setPhrase(text);
                                setError(null);
                            }}
                            placeholder="Enter your 12-word phrase separated by spaces"
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            multiline
                            numberOfLines={4}
                            autoCapitalize="none"
                            autoCorrect={false}
                            textAlignVertical="top"
                        />
                        <View style={styles.wordCountContainer}>
                            <Text style={[
                                styles.wordCountText,
                                wordCount === MNEMONIC_WORD_COUNT && styles.wordCountComplete,
                            ]}>
                                {wordCount}/{MNEMONIC_WORD_COUNT} words
                            </Text>
                        </View>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <MaterialIcons name="error-outline" size={18} color={WalletColors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Security Notice */}
                    <View style={styles.noticeContainer}>
                        <MaterialIcons name="security" size={20} color={WalletColors.textSecondary} />
                        <Text style={styles.noticeText}>
                            Your phrase is encrypted and stored securely on this device. We never have access to it.
                        </Text>
                    </View>
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.actions}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={WalletColors.primary} />
                            <Text style={styles.loadingText}>Importing wallet...</Text>
                        </View>
                    ) : (
                        <>
                            <PrimaryButton
                                title="Import Wallet"
                                onPress={handleImport}
                                icon="download"
                            />
                            <SecondaryButton
                                title="Cancel"
                                onPress={handleBack}
                            />
                        </>
                    )}
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
    instructions: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(55, 19, 236, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(55, 19, 236, 0.3)',
    },
    title: {
        fontFamily: FontFamily.displayBold,
        fontSize: 24,
        color: WalletColors.white,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: FontFamily.body,
        fontSize: 15,
        color: WalletColors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    inputLabel: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 14,
        color: WalletColors.textSecondary,
    },
    pasteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    pasteText: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 13,
        color: WalletColors.primary,
    },
    phraseInput: {
        backgroundColor: 'rgba(30, 25, 51, 0.8)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontFamily: FontFamily.body,
        fontSize: 16,
        color: WalletColors.white,
        minHeight: 120,
        lineHeight: 24,
    },
    phraseInputError: {
        borderColor: WalletColors.error,
    },
    wordCountContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    wordCountText: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        color: WalletColors.textSecondary,
    },
    wordCountComplete: {
        color: WalletColors.success,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        padding: 14,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    errorText: {
        flex: 1,
        fontFamily: FontFamily.body,
        fontSize: 13,
        color: WalletColors.error,
        lineHeight: 18,
    },
    noticeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: 'rgba(30, 25, 51, 0.5)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    noticeText: {
        flex: 1,
        fontFamily: FontFamily.body,
        fontSize: 13,
        color: WalletColors.textSecondary,
        lineHeight: 18,
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        gap: 12,
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 20,
    },
    loadingText: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 16,
        color: WalletColors.textSecondary,
    },
});
