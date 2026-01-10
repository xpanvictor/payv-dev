# payv-dev

A decentralized private transaction layer sitting on Mantle using zkSNARKs. 
Chain carries only two distinct data
- commitment root
- nullifier set 

This allows the chain to confirm and ensure a commitment exist in the tree and it has not been spent. 

Functionalities provided by contract:
1. Deposit: This is shielding. It's converting from public balance to private (commitment).
2. Transfer: Transferring ownership of a commitment to another. This is private transaction layer.
3. Withdraw: This is unshielding. Converting back to public balance and burning commitment. 

Supporting functionalities involve:
1. Join: This is taking two commitments, burning and converting to a single note. 
2. Split: Breaking a note to two. This is important for `withdrawal` of partial private balance into public balance. 

However, the contract only calls verify (mathematically verifies inputs) and then updates merkle root. 
