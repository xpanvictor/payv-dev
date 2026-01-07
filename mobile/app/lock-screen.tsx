import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Vibration,
} from 'react-native';
import { router } from 'expo-router';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { GradientBackground } from '@/components/GradientBackground';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
    verifyPin,
    PIN_LENGTH,
    isBiometricAvailable,
    isBiometricEnabled,
    authenticateWithBiometrics,
    getBiometricType,
    getBiometricLabel,
    BiometricType,
} from '@/services/authService';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

interface PinDotsProps {
    length: number;
    filled: number;
    error?: boolean;
}

function PinDots({ length, filled, error = false }: PinDotsProps) {
    return (
        <View style={styles.dotsContainer}>
            {Array.from({ length }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        index < filled && styles.dotFilled,
                        error && index < filled && styles.dotError,
                    ]}
                />
            ))}
        </View>
    );
}

interface NumpadProps {
    onPress: (digit: string) => void;
    onDelete: () => void;
    disabled?: boolean;
}

function Numpad({ onPress, onDelete, disabled = false }: NumpadProps) {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

    return (
        <View style={[styles.numpad, disabled && styles.numpadDisabled]}>
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
                            disabled={disabled}
                        >
                            <MaterialIcons
                                name="backspace"
                                size={24}
                                color={disabled ? WalletColors.textSecondary : WalletColors.white}
                            />
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.numpadButton}
                        onPress={() => onPress(digit)}
                        activeOpacity={0.7}
                        disabled={disabled}
                    >
                        <Text style={[
                            styles.numpadText,
                            disabled && styles.numpadTextDisabled,
                        ]}>
                            {digit}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

/**
 * Lock screen shown on app launch when wallet is secured.
 * Supports biometric authentication and PIN fallback.
 */
export default function LockScreen() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [biometricType, setBiometricType] = useState<BiometricType>(BiometricType.NONE);
    const [showBiometric, setShowBiometric] = useState(false);

    useEffect(() => {
        checkBiometricAndAuthenticate();
    }, []);

    const checkBiometricAndAuthenticate = async () => {
        const available = await isBiometricAvailable();
        const enabled = await isBiometricEnabled();

        if (available && enabled) {
            const type = await getBiometricType();
            setBiometricType(type);
            setShowBiometric(true);

            // Auto-trigger biometric on mount
            await attemptBiometricAuth();
        }
    };

    const attemptBiometricAuth = async () => {
        const success = await authenticateWithBiometrics();
        if (success) {
            navigateToDashboard();
        }
    };

    const handleDigitPress = async (digit: string) => {
        if (pin.length >= PIN_LENGTH || isLocked) return;

        const newPin = pin + digit;
        setPin(newPin);
        setError(null);

        if (newPin.length === PIN_LENGTH) {
            const isValid = await verifyPin(newPin);

            if (isValid) {
                navigateToDashboard();
            } else {
                Vibration.vibrate(200);
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= MAX_ATTEMPTS) {
                    setIsLocked(true);
                    setError(`Too many attempts. Try again in 30 seconds.`);

                    setTimeout(() => {
                        setIsLocked(false);
                        setAttempts(0);
                        setError(null);
                    }, LOCKOUT_DURATION_MS);
                } else {
                    setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
                }

                setPin('');
            }
        }
    };

    const handleDelete = () => {
        if (pin.length > 0 && !isLocked) {
            setPin(pin.slice(0, -1));
            setError(null);
        }
    };

    const navigateToDashboard = () => {
        router.replace('/(tabs)' as any);
    };

    const biometricLabel = getBiometricLabel(biometricType);

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="account-balance-wallet" size={32} color={WalletColors.primary} />
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>
                        Enter your PIN to unlock your wallet
                    </Text>
                </View>

                {/* PIN Dots */}
                <View style={styles.pinContainer}>
                    <PinDots length={PIN_LENGTH} filled={pin.length} error={!!error} />
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>

                {/* Numpad */}
                <View style={styles.numpadContainer}>
                    <Numpad
                        onPress={handleDigitPress}
                        onDelete={handleDelete}
                        disabled={isLocked}
                    />

                    {/* Biometric Button */}
                    {showBiometric && (
                        <TouchableOpacity
                            style={styles.biometricButton}
                            onPress={attemptBiometricAuth}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={biometricType === BiometricType.FACE_ID ? 'face' : 'fingerprint'}
                                size={24}
                                color={WalletColors.primary}
                            />
                            <Text style={styles.biometricText}>Use {biometricLabel}</Text>
                        </TouchableOpacity>
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
    dotError: {
        backgroundColor: WalletColors.error,
        borderColor: WalletColors.error,
    },
    errorText: {
        fontFamily: FontFamily.body,
        fontSize: 14,
        color: WalletColors.error,
        marginTop: 16,
        textAlign: 'center',
    },
    numpadContainer: {
        paddingHorizontal: 48,
        paddingBottom: 32,
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    numpadDisabled: {
        opacity: 0.5,
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
    numpadTextDisabled: {
        color: WalletColors.textSecondary,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginTop: 16,
    },
    biometricText: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 15,
        color: WalletColors.primary,
    },
});
