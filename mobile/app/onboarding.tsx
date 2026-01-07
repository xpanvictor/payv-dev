import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const HERO_IMAGE_SIZE = Math.min(width - 48, 320);

/**
 * Onboarding welcome screen.
 * First screen users see - introduces the wallet with hero visual and CTAs.
 */
export default function OnboardingScreen() {
    const handleCreateWallet = () => {
        router.push('/create-wallet' as any);
    };

    const handleImportWallet = () => {
        router.push('/create-wallet' as any);
    };

    const handleSkip = () => {
        router.replace('/(tabs)' as any);
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                {/* Top Navigation */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <MaterialIcons name="token" size={24} color={WalletColors.primary} />
                        <Text style={styles.logoText}>
                            Vault<Text style={styles.logoAccent}>3</Text>
                        </Text>
                    </View>
                    <Text style={styles.skipButton} onPress={handleSkip}>
                        Skip
                    </Text>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Hero Image */}
                    <View style={styles.heroContainer}>
                        {/* Glow effect */}
                        <View style={styles.heroGlow} />

                        {/* Hero image */}
                        <View style={styles.heroImageWrapper}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW8x6jbLfQXPMRzcuhci94AyFBe0BgqqROXUwEIR9GZWg6Z7-5MtWVpr2oC5rD2WHMrsZfbJHEzAVCMN-Gc0KK07mRTFAomD8_OA5VuVUYJ-gZkKcYYy-7RRooXGrcuruGfZ7P_Sp05SVI4I2oBJdWClGrD04Ca1GwKlhUOpmDIB-I3CiabQGyWY8SV_LIv1I2BfbmMfRFFx4gs_mhBM6c9WYIOnvvR85TNy0LOVxCRdD5E1-WPiu13wgOsx2_qU7zA5RIQxSQQ_M' }}
                                style={styles.heroImage}
                                resizeMode="cover"
                            />

                            {/* Floating badge */}
                            <View style={styles.floatingBadge}>
                                <View style={styles.badgeIcon}>
                                    <MaterialIcons name="shield" size={16} color={WalletColors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.badgeTitle}>End-to-End Encrypted</Text>
                                    <Text style={styles.badgeSubtitle}>Zero-knowledge proof</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Headlines */}
                    <View style={styles.headlines}>
                        <Text style={styles.title}>
                            Anonymous{'\n'}by Design
                        </Text>
                        <Text style={styles.subtitle}>
                            Transact freely without exposing your identity. Your keys, your data.
                        </Text>
                    </View>

                    {/* Page Indicators */}
                    <View style={styles.indicators}>
                        <View style={[styles.indicator, styles.indicatorActive]} />
                        <View style={styles.indicator} />
                        <View style={styles.indicator} />
                    </View>
                </View>

                {/* Bottom Actions */}
                <View style={styles.actions}>
                    <PrimaryButton
                        title="Create New Wallet"
                        onPress={handleCreateWallet}
                        icon="arrow-forward"
                    />
                    <SecondaryButton
                        title="I already have a wallet"
                        onPress={handleImportWallet}
                    />

                    {/* FaceID hint */}
                    <View style={styles.faceIdHint}>
                        <MaterialIcons name="face" size={18} color={WalletColors.textSecondary} />
                        <Text style={styles.faceIdText}>Secured by FaceID</Text>
                    </View>
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
    logoText: {
        fontFamily: FontFamily.displayBold,
        fontSize: 18,
        color: WalletColors.white,
        letterSpacing: -0.5,
    },
    logoAccent: {
        color: WalletColors.primary,
    },
    skipButton: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 14,
        color: WalletColors.textSecondary,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    heroContainer: {
        width: HERO_IMAGE_SIZE,
        height: HERO_IMAGE_SIZE,
        marginBottom: 32,
    },
    heroGlow: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        bottom: 16,
        backgroundColor: WalletColors.primary,
        borderRadius: HERO_IMAGE_SIZE / 2,
        opacity: 0.4,
    },
    heroImageWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: WalletColors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    floatingBadge: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    badgeIcon: {
        backgroundColor: 'rgba(55, 19, 236, 0.2)',
        padding: 6,
        borderRadius: 6,
    },
    badgeTitle: {
        fontFamily: FontFamily.bodyBold,
        fontSize: 12,
        color: WalletColors.white,
    },
    badgeSubtitle: {
        fontFamily: FontFamily.body,
        fontSize: 10,
        color: WalletColors.textSecondary,
        marginTop: 2,
    },
    headlines: {
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontFamily: FontFamily.displayBold,
        fontSize: 36,
        color: WalletColors.white,
        textAlign: 'center',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: FontFamily.body,
        fontSize: 16,
        color: WalletColors.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 24,
    },
    indicators: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 32,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: WalletColors.surfaceDark,
    },
    indicatorActive: {
        width: 24,
        backgroundColor: WalletColors.primary,
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        gap: 12,
    },
    faceIdHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        opacity: 0.6,
    },
    faceIdText: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        color: WalletColors.textSecondary,
    },
});
