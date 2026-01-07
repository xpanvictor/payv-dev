import React, { useState, useMemo } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getMnemonicWords, saveWallet } from '@/services/walletService';

const WORDS_TO_CONFIRM = 3;

/**
 * Generates random, unique indices for word verification.
 * Uses Fisher-Yates-style selection for truly random picks.
 */
function getRandomWordIndices(totalWords: number, count: number): number[] {
    const indices: number[] = [];
    const available = Array.from({ length: totalWords }, (_, i) => i);

    for (let i = 0; i < count && available.length > 0; i++) {
        const randomIdx = Math.floor(Math.random() * available.length);
        indices.push(available[randomIdx]);
        available.splice(randomIdx, 1);
    }

    return indices.sort((a, b) => a - b);
}

interface WordInputProps {
    wordNumber: number;
    value: string;
    onChangeText: (text: string) => void;
    isCorrect: boolean | null;
}

function WordInput({ wordNumber, value, onChangeText, isCorrect }: WordInputProps) {
    const getBorderColor = () => {
        if (isCorrect === null) return 'rgba(255, 255, 255, 0.1)';
        return isCorrect ? WalletColors.success : WalletColors.error;
    };

    return (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Word #{wordNumber}</Text>
            <View style={[styles.inputWrapper, { borderColor: getBorderColor() }]}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Enter word"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {isCorrect !== null && (
                    <MaterialIcons
                        name={isCorrect ? 'check-circle' : 'cancel'}
                        size={20}
                        color={isCorrect ? WalletColors.success : WalletColors.error}
                    />
                )}
            </View>
        </View>
    );
}

/**
 * Verifies user has backed up their passphrase by asking them
 * to enter 3 random words from their mnemonic.
 */
export default function PassphraseConfirmScreen() {
    const { mnemonic, address } = useLocalSearchParams<{ mnemonic: string; address: string }>();
    const [inputs, setInputs] = useState<string[]>(Array(WORDS_TO_CONFIRM).fill(''));
    const [validation, setValidation] = useState<(boolean | null)[]>(Array(WORDS_TO_CONFIRM).fill(null));
    const [loading, setLoading] = useState(false);

    const words = mnemonic ? getMnemonicWords(mnemonic) : [];

    // Generate random indices once on mount
    const wordIndices = useMemo(() => {
        const STANDARD_MNEMONIC_LENGTH = 12;
        return getRandomWordIndices(STANDARD_MNEMONIC_LENGTH, WORDS_TO_CONFIRM);
    }, []);

    const handleInputChange = (index: number, text: string) => {
        const newInputs = [...inputs];
        newInputs[index] = text.toLowerCase().trim();
        setInputs(newInputs);

        // Reset validation when user types
        const newValidation = [...validation];
        newValidation[index] = null;
        setValidation(newValidation);
    };

    const handleVerify = async () => {
        // Validate each input
        const results = wordIndices.map((wordIdx, inputIdx) => {
            const expected = words[wordIdx]?.toLowerCase();
            const entered = inputs[inputIdx]?.toLowerCase().trim();
            return expected === entered;
        });

        setValidation(results);

        const allCorrect = results.every(Boolean);

        if (!allCorrect) {
            Alert.alert(
                'Incorrect Words',
                'Some words don\'t match. Please check and try again.',
                [{ text: 'OK' }]
            );
            return;
        }

        // All correct — save the wallet
        setLoading(true);
        try {
            await saveWallet({ mnemonic: mnemonic!, address: address! });

            // Navigate to PIN setup
            router.replace('/setup-pin' as any);
        } catch (error) {
            Alert.alert(
                'Error',
                'Failed to save wallet. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={WalletColors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confirm Phrase</Text>
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
                            <MaterialIcons name="verified-user" size={32} color={WalletColors.primary} />
                        </View>
                        <Text style={styles.title}>Verify Your Backup</Text>
                        <Text style={styles.subtitle}>
                            Enter the following words from your recovery phrase to confirm you've saved it.
                        </Text>
                    </View>

                    {/* Word Inputs */}
                    <View style={styles.inputsContainer}>
                        {wordIndices.map((wordIdx, inputIdx) => (
                            <WordInput
                                key={wordIdx}
                                wordNumber={wordIdx + 1}
                                value={inputs[inputIdx]}
                                onChangeText={(text) => handleInputChange(inputIdx, text)}
                                isCorrect={validation[inputIdx]}
                            />
                        ))}
                    </View>

                    {/* Hint */}
                    <View style={styles.hintContainer}>
                        <MaterialIcons name="info-outline" size={16} color={WalletColors.textSecondary} />
                        <Text style={styles.hintText}>
                            Enter the words exactly as they appear in your passphrase
                        </Text>
                    </View>
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.actions}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={WalletColors.primary} />
                            <Text style={styles.loadingText}>Creating wallet...</Text>
                        </View>
                    ) : (
                        <>
                            <PrimaryButton
                                title="Verify & Create Wallet"
                                onPress={handleVerify}
                                icon="check-circle"
                            />
                            <SecondaryButton
                                title="Go Back"
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
    inputsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    inputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 14,
        color: WalletColors.textSecondary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 25, 51, 0.8)',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontFamily: FontFamily.body,
        fontSize: 16,
        color: WalletColors.white,
        paddingVertical: 16,
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(30, 25, 51, 0.5)',
        padding: 14,
        borderRadius: 10,
    },
    hintText: {
        flex: 1,
        fontFamily: FontFamily.body,
        fontSize: 13,
        color: WalletColors.textSecondary,
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
