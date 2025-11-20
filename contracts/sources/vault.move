module pass_me::vault {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};

    // ==================== ERRORS ====================
    const ENotOwner: u64 = 1;
    const EVaultNotFound: u64 = 2;
    const EInvalidWalrusBlob: u64 = 3;
    const EVaultLocked: u64 = 4;

    // ==================== STRUCTS ====================
    /// Main Vault object - one per user
    public struct Vault has key, store {
        id: UID,
        owner: address,
        walrus_blob_id: String,          // Encrypted vault data on Walrus
        created_at: u64,
        updated_at: u64,
        total_entries: u64,
        is_locked: bool,
        zklogin_enabled: bool,
    }

    /// Admin capability for vault management
    public struct VaultCap has key, store {
        id: UID,
        vault_id: ID,
    }

    // ==================== EVENTS ====================
    public struct VaultCreated has copy, drop {
        vault_id: ID,
        owner: address,
        created_at: u64,
    }

    public struct VaultUpdated has copy, drop {
        vault_id: ID,
        owner: address,
        walrus_blob_id: String,
        updated_at: u64,
    }

    public struct VaultLocked has copy, drop {
        vault_id: ID,
        owner: address,
        timestamp: u64,
    }

    public struct VaultUnlocked has copy, drop {
        vault_id: ID,
        owner: address,
        timestamp: u64,
    }

    // ==================== FUNCTIONS ====================
    /// Create a new vault for the user
    public entry fun create_vault(
        walrus_blob_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let vault_uid = object::new(ctx);
        let vault_id = object::uid_to_inner(&vault_uid);

        let vault = Vault {
            id: vault_uid,
            owner: sender,
            walrus_blob_id: string::utf8(walrus_blob_id),
            created_at: clock::timestamp_ms(clock),
            updated_at: clock::timestamp_ms(clock),
            total_entries: 0,
            is_locked: false,
            zklogin_enabled: false,
        };

        // Create capability
        let cap = VaultCap {
            id: object::new(ctx),
            vault_id,
        };

        // Emit event
        event::emit(VaultCreated {
            vault_id,
            owner: sender,
            created_at: clock::timestamp_ms(clock),
        });

        // Transfer vault and cap to sender
        transfer::share_object(vault);
        transfer::transfer(cap, sender);
    }

    /// Update vault data (new Walrus blob)
    public entry fun update_vault(
        vault: &mut Vault,
        cap: &VaultCap,
        new_walrus_blob_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify ownership
        assert!(vault.owner == sender, ENotOwner);
        assert!(object::id(vault) == cap.vault_id, EVaultNotFound);
        assert!(!vault.is_locked, EVaultLocked);

        // Update vault
        vault.walrus_blob_id = string::utf8(new_walrus_blob_id);
        vault.updated_at = clock::timestamp_ms(clock);

        // Emit event
        event::emit(VaultUpdated {
            vault_id: object::id(vault),
            owner: sender,
            walrus_blob_id: vault.walrus_blob_id,
            updated_at: vault.updated_at,
        });
    }

    /// Increment entry count
    public entry fun increment_entries(
        vault: &mut Vault,
        cap: &VaultCap,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(vault.owner == sender, ENotOwner);
        assert!(object::id(vault) == cap.vault_id, EVaultNotFound);
        
        vault.total_entries = vault.total_entries + 1;
    }

    /// Lock vault (emergency)
    public entry fun lock_vault(
        vault: &mut Vault,
        cap: &VaultCap,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(vault.owner == sender, ENotOwner);
        assert!(object::id(vault) == cap.vault_id, EVaultNotFound);

        vault.is_locked = true;

        event::emit(VaultLocked {
            vault_id: object::id(vault),
            owner: sender,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Unlock vault
    public entry fun unlock_vault(
        vault: &mut Vault,
        cap: &VaultCap,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(vault.owner == sender, ENotOwner);
        assert!(object::id(vault) == cap.vault_id, EVaultNotFound);

        vault.is_locked = false;

        event::emit(VaultUnlocked {
            vault_id: object::id(vault),
            owner: sender,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Enable zkLogin
    public entry fun enable_zklogin(
        vault: &mut Vault,
        cap: &VaultCap,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(vault.owner == sender, ENotOwner);
        assert!(object::id(vault) == cap.vault_id, EVaultNotFound);

        vault.zklogin_enabled = true;
    }

    // ==================== GETTERS ====================
    public fun get_owner(vault: &Vault): address {
        vault.owner
    }

    public fun get_walrus_blob_id(vault: &Vault): String {
        vault.walrus_blob_id
    }

    public fun get_total_entries(vault: &Vault): u64 {
        vault.total_entries
    }

    public fun is_locked(vault: &Vault): bool {
        vault.is_locked
    }

    public fun is_zklogin_enabled(vault: &Vault): bool {
        vault.zklogin_enabled
    }
}