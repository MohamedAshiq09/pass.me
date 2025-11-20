module pass_me::password_entry {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;

    // ==================== ERRORS ====================
    const ENotOwner: u64 = 1;
    const EDeviceNotWhitelisted: u64 = 2;
    const EInvalidDomain: u64 = 3;

    // ==================== STRUCTS ====================
    public struct PasswordEntry has key, store {
        id: UID,
        vault_id: ID,
        domain_hash: vector<u8>,         // SHA256 hash of domain
        password_hash: vector<u8>,       // SHA256 hash of generated password
        device_whitelist: vector<vector<u8>>, // Whitelisted device IDs
        created_at: u64,
        last_used: u64,
        usage_count: u64,
    }

    // ==================== EVENTS ====================
    public struct PasswordEntryCreated has copy, drop {
        entry_id: ID,
        vault_id: ID,
        domain_hash: vector<u8>,
        created_at: u64,
    }

    public struct PasswordUsed has copy, drop {
        entry_id: ID,
        vault_id: ID,
        domain_hash: vector<u8>,
        device_id: vector<u8>,
        timestamp: u64,
        usage_count: u64,
    }

    public struct DeviceAdded has copy, drop {
        entry_id: ID,
        device_id: vector<u8>,
        timestamp: u64,
    }

    // ==================== FUNCTIONS ====================
    /// Create a new password entry
    public entry fun create_entry(
        vault_id: ID,
        domain_hash: vector<u8>,
        password_hash: vector<u8>,
        initial_device_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(vector::length(&domain_hash) == 32, EInvalidDomain); // SHA256 = 32 bytes

        let entry_uid = object::new(ctx);
        let entry_id = object::uid_to_inner(&entry_uid);

        let mut device_whitelist = vector::empty<vector<u8>>();
        vector::push_back(&mut device_whitelist, initial_device_id);

        let entry = PasswordEntry {
            id: entry_uid,
            vault_id,
            domain_hash,
            password_hash,
            device_whitelist,
            created_at: clock::timestamp_ms(clock),
            last_used: clock::timestamp_ms(clock),
            usage_count: 0,
        };

        event::emit(PasswordEntryCreated {
            entry_id,
            vault_id,
            domain_hash,
            created_at: clock::timestamp_ms(clock),
        });

        transfer::share_object(entry);
    }

    /// Record password usage
    public entry fun record_usage(
        entry: &mut PasswordEntry,
        device_id: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // Verify device is whitelisted
        assert!(is_device_whitelisted(entry, &device_id), EDeviceNotWhitelisted);

        entry.last_used = clock::timestamp_ms(clock);
        entry.usage_count = entry.usage_count + 1;

        event::emit(PasswordUsed {
            entry_id: object::id(entry),
            vault_id: entry.vault_id,
            domain_hash: entry.domain_hash,
            device_id,
            timestamp: clock::timestamp_ms(clock),
            usage_count: entry.usage_count,
        });
    }

    /// Add device to whitelist
    public entry fun add_device(
        entry: &mut PasswordEntry,
        device_id: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        // Check if device already exists
        if (!is_device_whitelisted(entry, &device_id)) {
            vector::push_back(&mut entry.device_whitelist, device_id);

            event::emit(DeviceAdded {
                entry_id: object::id(entry),
                device_id,
                timestamp: clock::timestamp_ms(clock),
            });
        };
    }

    /// Check if device is whitelisted
    fun is_device_whitelisted(entry: &PasswordEntry, device_id: &vector<u8>): bool {
        let len = vector::length(&entry.device_whitelist);
        let mut i = 0;
        while (i < len) {
            if (vector::borrow(&entry.device_whitelist, i) == device_id) {
                return true
            };
            i = i + 1;
        };
        false
    }

    // ==================== GETTERS ====================
    public fun get_vault_id(entry: &PasswordEntry): ID {
        entry.vault_id
    }

    public fun get_domain_hash(entry: &PasswordEntry): vector<u8> {
        entry.domain_hash
    }

    public fun get_usage_count(entry: &PasswordEntry): u64 {
        entry.usage_count
    }

    public fun get_last_used(entry: &PasswordEntry): u64 {
        entry.last_used
    }

    public fun get_device_whitelist(entry: &PasswordEntry): vector<vector<u8>> {
        entry.device_whitelist
    }
}