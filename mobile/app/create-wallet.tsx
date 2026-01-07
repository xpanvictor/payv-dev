import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    SafeAreaView,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createWallet } from '@/services/walletService';

const { width } = Dimensions.get('window');

interface TrustBadgeProps {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
}

function TrustBadge({ icon, label }: TrustBadgeProps) {
    return (
        <View style={styles.badge}>
            <MaterialIcons name={icon} size={24} color={WalletColors.primary} />
            <Text style={styles.badgeLabel}>{label}</Text>
        </View>
    );
}

/**
 * Create/Import Wallet screen.
 * Allows users to create a new wallet or import an existing one.
 */
export default function CreateWalletScreen() {
    const handleCreate = () => {
        try {
            const wallet = createWallet();
            router.push({
                pathname: '/passphrase-display',
                params: { mnemonic: wallet.mnemonic, address: wallet.address },
            } as any);
        } catch (error) {
            Alert.alert('Error', 'Failed to create wallet. Please try again.');
            console.log(error);
            
        }
    };

    const handleImport = () => {
        router.push('/import-wallet' as any);
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <MaterialIcons name="account-balance-wallet" size={20} color={WalletColors.white} />
                        </View>
                        <Text style={styles.logoText}>NovaWallet</Text>
                    </View>
                    <TouchableOpacity>
                        <MaterialIcons name="help-outline" size={24} color="rgba(255, 255, 255, 0.7)" />
                    </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Image */}
                    <View style={styles.heroContainer}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5ezpOfefwlk1K9D8cwT7Uy31rGX6rLkaz1FK7yNDkcqQX3ZDmc1xB6IqtUagBi2zd3r0s7aWUYq9OqIgr2r5bejOu6BXzyg9qd9-yqbYNA5dUo7jE2iVJ5pptUD20onj36GWSfblyApuqOeasd0PQS2ynLNBN7D3VPI3q8qGeAaBaHITmLvd58gSIy_ayhErd7oiVbxO9o37jDkE0BfPhy8_S2gTrPjAytfdeiNG_QiDyNQe1IevMXfF5fxFWHdQ2SQIH4RG4WBI' }}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(19, 16, 34, 0.6)', WalletColors.backgroundDark]}
                            style={styles.heroOverlay}
                        />
                    </View>

                    {/* Headlines */}
                    <View style={styles.headlines}>
                        <Text style={styles.title}>
                            Secure Your <Text style={styles.titleAccent}>Assets</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Zero tracking. Complete transparency.{'\n'}Your keys, your crypto.
                        </Text>
                    </View>

                    {/* Trust Badges */}
                    <View style={styles.badges}>
                        <TrustBadge icon="lock" label="ENCRYPTED" />
                        <TrustBadge icon="visibility-off" label="PRIVATE" />
                        <TrustBadge icon="token" label="WEB3 READY" />
                    </View>
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.actions}>
                    <PrimaryButton
                        title="Create a New Wallet"
                        onPress={handleCreate}
                        icon="add-circle-outline"
                    />
                    <SecondaryButton
                        title="I already have a wallet"
                        onPress={handleImport}
                        icon="download"
                    />

                    {/* Legal Footer */}
                    <Text style={styles.legal}>
                        By continuing, you agree to our{' '}
                        <Text style={styles.legalLink}>Terms of Service</Text> &{' '}
                        <Text style={styles.legalLink}>Privacy Policy</Text>.
                    </Text>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(55, 19, 236, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoText: {
        fontFamily: FontFamily.displayBold,
        fontSize: 18,
        color: WalletColors.white,
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 16,
    },
    heroContainer: {
        width: width - 48,
        aspectRatio: 1,
        maxHeight: 320,
        marginHorizontal: 24,
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    headlines: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 12,
    },
    title: {
        fontFamily: FontFamily.displayBold,
        fontSize: 32,
        color: WalletColors.white,
        textAlign: 'center',
        lineHeight: 38,
        letterSpacing: -0.5,
    },
    titleAccent: {
        color: WalletColors.primary,
    },
    subtitle: {
        fontFamily: FontFamily.body,
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 24,
    },
    badges: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 24,
        gap: 8,
    },
    badge: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 25, 51, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    badgeLabel: {
        fontFamily: FontFamily.bodyBold,
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 1,
        textAlign: 'center',
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        gap: 12,
    },
    legal: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
        marginTop: 8,
    },
    legalLink: {
        color: 'rgba(255, 255, 255, 0.5)',
        textDecorationLine: 'underline',
    },
});
