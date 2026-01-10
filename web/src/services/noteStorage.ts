/**
 * Note Storage Service
 *
 * Encrypted local storage for private notes.
 * Notes are stored in localStorage, encrypted with a PIN-derived key.
 *
 * Storage structure:
 * - vault3_notes: Encrypted array of notes
 * - vault3_notes_hash: Hash of PIN for verification
 */

import { type Note } from './circuitTypes';
import {
    computeNoteCommitment,
    computeNullifierFromNote,
    fieldToHex,
} from '../utils/poseidonHash';

// ============================================================================
// Storage Keys
// ============================================================================

enum StorageKey {
    NOTES = 'vault3_notes',
    NOTES_HASH = 'vault3_notes_hash',
}

// ============================================================================
// Encryption Helpers
// ============================================================================

/**
 * Simple XOR encryption (same as used in walletService).
 * For production, use a proper encryption library.
 */
function xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
            text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return btoa(result);
}

/**
 * XOR decryption (symmetric with encryption)
 */
function xorDecrypt(encryptedBase64: string, key: string): string {
    const encrypted = atob(encryptedBase64);
    let result = '';
    for (let i = 0; i < encrypted.length; i++) {
        result += String.fromCharCode(
            encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return result;
}

/**
 * Hash a PIN using SHA-256
 */
async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const pinHash = await crypto.subtle.digest('SHA-256', pinData);
    return Array.from(new Uint8Array(pinHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// ============================================================================
// Note Serialization
// ============================================================================

interface SerializedNote {
    owner: string;
    value: string;
    secret: string;
    commitment: string;
    nullifier: string;
    createdAt: number;
    spent: boolean;
}

function serializeNote(note: Note): SerializedNote {
    const commitment = computeNoteCommitment(note.owner, note.value, note.secret);
    const nullifier = computeNullifierFromNote(note.owner, note.value, note.secret);

    return {
        owner: note.owner.toString(),
        value: note.value.toString(),
        secret: note.secret.toString(),
        commitment: fieldToHex(commitment),
        nullifier: fieldToHex(nullifier),
        createdAt: Date.now(),
        spent: false,
    };
}

function deserializeNote(serialized: SerializedNote): Note & {
    commitment: string;
    nullifier: string;
    createdAt: number;
    spent: boolean;
} {
    return {
        owner: BigInt(serialized.owner),
        value: BigInt(serialized.value),
        secret: BigInt(serialized.secret),
        commitment: serialized.commitment,
        nullifier: serialized.nullifier,
        createdAt: serialized.createdAt,
        spent: serialized.spent,
    };
}

// ============================================================================
// Extended Note Type (with metadata)
// ============================================================================

export interface StoredNote extends Note {
    commitment: string;
    nullifier: string;
    createdAt: number;
    spent: boolean;
}

// ============================================================================
// Note Storage Functions
// ============================================================================

/**
 * Save a new note to encrypted storage
 */
export async function saveNote(note: Note, pin: string): Promise<StoredNote> {
    const pinHash = await hashPin(pin);

    // Load existing notes
    const existingNotes = await loadNotesInternal(pinHash);

    // Serialize and add new note
    const serialized = serializeNote(note);
    existingNotes.push(serialized);

    // Encrypt and save
    const encrypted = xorEncrypt(JSON.stringify(existingNotes), pinHash);
    localStorage.setItem(StorageKey.NOTES, encrypted);
    localStorage.setItem(StorageKey.NOTES_HASH, pinHash);

    return deserializeNote(serialized);
}

/**
 * Load all notes from encrypted storage
 */
export async function loadNotes(pin: string): Promise<StoredNote[]> {
    const pinHash = await hashPin(pin);
    const storedHash = localStorage.getItem(StorageKey.NOTES_HASH);

    if (storedHash && pinHash !== storedHash) {
        throw new Error('Incorrect PIN');
    }

    const serializedNotes = await loadNotesInternal(pinHash);
    return serializedNotes.map(deserializeNote);
}

/**
 * Internal loader (uses pre-hashed PIN)
 */
async function loadNotesInternal(pinHash: string): Promise<SerializedNote[]> {
    const encrypted = localStorage.getItem(StorageKey.NOTES);
    if (!encrypted) {
        return [];
    }

    try {
        const decrypted = xorDecrypt(encrypted, pinHash);
        return JSON.parse(decrypted) as SerializedNote[];
    } catch {
        return [];
    }
}

/**
 * Get unspent notes only
 */
export async function getUnspentNotes(pin: string): Promise<StoredNote[]> {
    const notes = await loadNotes(pin);
    return notes.filter((n) => !n.spent);
}

/**
 * Get total private balance from unspent notes
 */
export async function getPrivateBalanceFromNotes(pin: string): Promise<bigint> {
    const unspent = await getUnspentNotes(pin);
    return unspent.reduce((sum, note) => sum + note.value, BigInt(0));
}

/**
 * Mark a note as spent by its nullifier
 */
export async function markNoteSpent(
    nullifier: string,
    pin: string
): Promise<boolean> {
    const pinHash = await hashPin(pin);
    const notes = await loadNotesInternal(pinHash);

    const noteIndex = notes.findIndex((n) => n.nullifier === nullifier);
    if (noteIndex === -1) {
        return false;
    }

    notes[noteIndex].spent = true;

    const encrypted = xorEncrypt(JSON.stringify(notes), pinHash);
    localStorage.setItem(StorageKey.NOTES, encrypted);

    return true;
}

/**
 * Delete a note by its nullifier (use with caution)
 */
export async function deleteNote(nullifier: string, pin: string): Promise<boolean> {
    const pinHash = await hashPin(pin);
    const notes = await loadNotesInternal(pinHash);

    const filteredNotes = notes.filter((n) => n.nullifier !== nullifier);
    if (filteredNotes.length === notes.length) {
        return false;
    }

    const encrypted = xorEncrypt(JSON.stringify(filteredNotes), pinHash);
    localStorage.setItem(StorageKey.NOTES, encrypted);

    return true;
}

/**
 * Clear all stored notes (use with extreme caution)
 */
export function clearAllNotes(): void {
    localStorage.removeItem(StorageKey.NOTES);
    localStorage.removeItem(StorageKey.NOTES_HASH);
}

/**
 * Check if notes storage exists
 */
export function hasStoredNotes(): boolean {
    return localStorage.getItem(StorageKey.NOTES) !== null;
}

/**
 * Get note by commitment
 */
export async function getNoteByCommitment(
    commitment: string,
    pin: string
): Promise<StoredNote | null> {
    const notes = await loadNotes(pin);
    return notes.find((n) => n.commitment === commitment) ?? null;
}

/**
 * Get note by nullifier
 */
export async function getNoteByNullifier(
    nullifier: string,
    pin: string
): Promise<StoredNote | null> {
    const notes = await loadNotes(pin);
    return notes.find((n) => n.nullifier === nullifier) ?? null;
}
