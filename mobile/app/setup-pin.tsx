import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    Vibration,
} from 'react-native';
import { router } from 'expo-router';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { GradientBackground } from '@/components/GradientBackground';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
    setupPin,
    PIN_LENGTH,
    isBiometricAvailable,
    setBiometricEnabled,
    getBiometricType,
    getBiometricLabel,
} from '@/services/authService';

enum SetupStep {
    ENTER = 'enter',
    CONFIRM = 'confirm',
}

interface PinDotsProps {
    length: number;
    filled: number;
}

function PinDots({ length, filled }: PinDotsProps) {
    return (
        <View style={styles.dotsContainer}>
            {Array.from({ length }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        index < filled && styles.dotFilled,
                    ]}
                />
            ))}
        </View>
    );
}

interface NumpadProps {
    onPress: (digit: string) => void;
    onDelete: () => void;
}

function Numpad({ onPress, onDelete }: NumpadProps) {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

    return (
        <View style={styles.numpad}>
            {digits.map((digit, index) => {
                if (digit === '') {
                    return <View key={index} style={styles.numpadButton} />;
                }

                if (digit === 'del') {
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.numpadButton}
                            onPress={onDelete}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="backspace" size={24} color={WalletColors.white} />
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.numpadButton}
                        onPress={() => onPress(digit)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.numpadText}>{digit}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

/**
 * PIN setup screen for first-time wallet security configuration.
 */
export default function SetupPinScreen() {
    const [step, setStep] = useState<SetupStep>(SetupStep.ENTER);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState<string | null>(null);

    const currentPin = step === SetupStep.ENTER ? pin : confirmPin;
    const setCurrentPin = step === SetupStep.ENTER ? setPin : setConfirmPin;

    const handleDigitPress = async (digit: string) => {
        if (currentPin.length >= PIN_LENGTH) return;

        const newPin = currentPin + digit;
        setCurrentPin(newPin);
        setError(null);

        if (newPin.length === PIN_LENGTH) {
            if (step === SetupStep.ENTER) {
                // Move to confirm step
                setTimeout(() => {
                    setStep(SetupStep.CONFIRM);
                }, 200);
            } else {
                // Verify PINs match
                if (newPin === pin) {
                    await savePinAndContinue(newPin);
                } else {
                    Vibration.vibrate(200);
                    setError('PINs do not match. Try again.');
                    setConfirmPin('');
                    setStep(SetupStep.ENTER);
                    setPin('');
                }
            }
        }
    };

    const handleDelete = () => {
        if (currentPin.length > 0) {
            setCurrentPin(currentPin.slice(0, -1));
            setError(null);
        }
    };

    const savePinAndContinue = async (finalPin: string) => {
        try {
            await setupPin(finalPin);

            // Check if biometric is available and offer to enable
            const biometricAvailable = await isBiometricAvailable();
            if (biometricAvailable) {
                const biometricType = await getBiometricType();
                const label = getBiometricLabel(biometricType);

                Alert.alert(
                    `Enable ${label}?`,
                    `Would you like to use ${label} to unlock your wallet?`,
                    [
                        {
                            text: 'No Thanks',
                            style: 'cancel',
                            onPress: () => navigateToDashboard(),
                        },
                        {
                            text: 'Enable',
                            onPress: async () => {
                                await setBiometricEnabled(true);
                                navigateToDashboard();
                            },
                        },
                    ]
                );
            } else {
                navigateToDashboard();
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to save PIN. Please try again.');
            setPin('');
            setConfirmPin('');
            setStep(SetupStep.ENTER);
        }
    };

    const navigateToDashboard = () => {
        router.replace('/(tabs)' as any);
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="lock" size={32} color={WalletColors.primary} />
                    </View>
                    <Text style={styles.title}>
                        {step === SetupStep.ENTER ? 'Create PIN' : 'Confirm PIN'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === SetupStep.ENTER
                            ? 'Enter a 6-digit PIN to secure your wallet'
                            : 'Re-enter your PIN to confirm'}
                    </Text>
                </View>

                {/* PIN Dots */}
                <View style={styles.pinContainer}>
                    <PinDots length={PIN_LENGTH} filled={currentPin.length} />
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>

                {/* Numpad */}
                <View style={styles.numpadContainer}>
                    <Numpad onPress={handleDigitPress} onDelete={handleDelete} />
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
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(55, 19, 236, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(55, 19, 236, 0.3)',
    },
    title: {
        fontFamily: FontFamily.displayBold,
        fontSize: 28,
        color: WalletColors.white,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: FontFamily.body,
        fontSize: 15,
        color: WalletColors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    pinContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    dotFilled: {
        backgroundColor: WalletColors.primary,
        borderColor: WalletColors.primary,
    },
    errorText: {
        fontFamily: FontFamily.body,
        fontSize: 14,
        color: WalletColors.error,
        marginTop: 16,
    },
    numpadContainer: {
        paddingHorizontal: 48,
        paddingBottom: 48,
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    numpadButton: {
        width: '33.33%',
        aspectRatio: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numpadText: {
        fontFamily: FontFamily.displayBold,
        fontSize: 28,
        color: WalletColors.white,
    },
});
