import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// ============================================================================
// Storage Keys
// ============================================================================

enum AuthStorageKey {
    PIN_HASH = 'auth_pin_hash',
    BIOMETRIC_ENABLED = 'auth_biometric_enabled',
}

// ============================================================================
// PIN Configuration
// ============================================================================

export const PIN_LENGTH = 6;

// ============================================================================
// Biometric Types
// ============================================================================

export enum BiometricType {
    FINGERPRINT = 'fingerprint',
    FACE_ID = 'faceId',
    IRIS = 'iris',
    NONE = 'none',
}

// ============================================================================
// Auth Service Functions
// ============================================================================

/**
 * Simple hash function for PIN storage.
 * For production, use a proper hashing library like bcrypt.
 */
function hashPin(pin: string): string {
    // Simple hash - in production use proper crypto
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
}

/**
 * Sets up a new PIN for the wallet.
 */
export async function setupPin(pin: string): Promise<void> {
    if (pin.length !== PIN_LENGTH) {
        throw new Error(`PIN must be exactly ${PIN_LENGTH} digits`);
    }

    if (!/^\d+$/.test(pin)) {
        throw new Error('PIN must contain only digits');
    }

    const hashedPin = hashPin(pin);
    await SecureStore.setItemAsync(AuthStorageKey.PIN_HASH, hashedPin);
}

/**
 * Verifies if the entered PIN matches the stored PIN.
 */
export async function verifyPin(pin: string): Promise<boolean> {
    const storedHash = await SecureStore.getItemAsync(AuthStorageKey.PIN_HASH);
    if (!storedHash) {
        return false;
    }

    const enteredHash = hashPin(pin);
    return storedHash === enteredHash;
}

/**
 * Checks if a PIN has been set up.
 */
export async function hasPinSetup(): Promise<boolean> {
    const storedHash = await SecureStore.getItemAsync(AuthStorageKey.PIN_HASH);
    return storedHash !== null;
}

/**
 * Deletes the stored PIN (for wallet reset).
 */
export async function clearPin(): Promise<void> {
    await SecureStore.deleteItemAsync(AuthStorageKey.PIN_HASH);
    await SecureStore.deleteItemAsync(AuthStorageKey.BIOMETRIC_ENABLED);
}

/**
 * Checks if biometric authentication is available on the device.
 */
export async function isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
}

/**
 * Gets the type of biometric available on the device.
 */
export async function getBiometricType(): Promise<BiometricType> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return BiometricType.FACE_ID;
    }

    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return BiometricType.FINGERPRINT;
    }

    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return BiometricType.IRIS;
    }

    return BiometricType.NONE;
}

/**
 * Attempts biometric authentication.
 * @returns true if authentication succeeded, false otherwise
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
    const isAvailable = await isBiometricAvailable();
    if (!isAvailable) {
        return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your wallet',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: true, // We handle PIN fallback ourselves
        cancelLabel: 'Cancel',
    });

    return result.success;
}

/**
 * Enables or disables biometric authentication preference.
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(
        AuthStorageKey.BIOMETRIC_ENABLED,
        enabled ? 'true' : 'false'
    );
}

/**
 * Checks if biometric authentication is enabled by the user.
 */
export async function isBiometricEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(AuthStorageKey.BIOMETRIC_ENABLED);
    return value === 'true';
}

/**
 * Returns a user-friendly name for the biometric type.
 */
export function getBiometricLabel(type: BiometricType): string {
    switch (type) {
        case BiometricType.FACE_ID:
            return 'Face ID';
        case BiometricType.FINGERPRINT:
            return 'Fingerprint';
        case BiometricType.IRIS:
            return 'Iris';
        default:
            return 'Biometric';
    }
}
