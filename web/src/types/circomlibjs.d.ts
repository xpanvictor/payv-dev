/**
 * Type declarations for circomlibjs
 */

declare module 'circomlibjs' {
    export interface Poseidon {
        (inputs: (bigint | number | string)[]): Uint8Array;
        F: {
            toObject(value: Uint8Array): bigint;
        };
    }

    export function buildPoseidon(): Promise<Poseidon>;
}
