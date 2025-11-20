module pass_me::zklogin_integration {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};

    // ==================== ERRORS ====================
    const ENotAuthorized: u64 = 1;
    const EInvalidProvider: u64 = 2;
    const EAlreadyLinked: u64 = 3;

    // ==================== STRUCTS ====================
    public struct ZkLoginProfile has key, store {
        id: UID,
        vault_id: ID,
        provider: String,           // "google", "apple", "facebook"
        subject_id: String,         // OAuth subject ID
        email_hash: vector<u8>,     // Hashed email for privacy
        linked_at: u64,
        last_login: u64,
        is_active: bool,
    }

    // ==================== EVENTS ====================
    public struct ZkLoginLinked has copy, drop {
        vault_id: ID,
        provider: String,
        subject_id: String,
        timestamp: u64,
    }

    public struct ZkLoginUsed has copy, drop {
        vault_id: ID,
        provider: String,
        subject_id: String,
        timestamp: u64,
    }

    public struct ZkLoginRevoked has copy, drop {
        vault_id: ID,
        provider: String,
        subject_id: String,
        timestamp: u64,
    }

    // ==================== FUNCTIONS ====================
    /// Link zkLogin provider to vault
    public entry fun link_zklogin(
        vault_id: ID,
        provider: vector<u8>,
        subject_id: vector<u8>,
        email_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let profile_uid = object::new(ctx);
        let provider_str = string::utf8(provider);
        let subject_str = string::utf8(subject_id);

        let profile = ZkLoginProfile {
            id: profile_uid,
            vault_id,
            provider: provider_str,
            subject_id: subject_str,
            email_hash,
            linked_at: clock::timestamp_ms(clock),
            last_login: clock::timestamp_ms(clock),
            is_active: true,
        };

        event::emit(ZkLoginLinked {
            vault_id,
            provider: provider_str,
            subject_id: subject_str,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::share_object(profile);
    }

    /// Record zkLogin usage
    public entry fun record_zklogin_usage(
        profile: &mut ZkLoginProfile,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(profile.is_active, ENotAuthorized);

        profile.last_login = clock::timestamp_ms(clock);

        event::emit(ZkLoginUsed {
            vault_id: profile.vault_id,
            provider: profile.provider,
            subject_id: profile.subject_id,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Revoke zkLogin access
    public entry fun revoke_zklogin(
        profile: &mut ZkLoginProfile,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        profile.is_active = false;

        event::emit(ZkLoginRevoked {
            vault_id: profile.vault_id,
            provider: profile.provider,
            subject_id: profile.subject_id,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // ==================== GETTERS ====================
    public fun get_vault_id(profile: &ZkLoginProfile): ID {
        profile.vault_id
    }

    public fun get_provider(profile: &ZkLoginProfile): String {
        profile.provider
    }

    public fun get_subject_id(profile: &ZkLoginProfile): String {
        profile.subject_id
    }

    public fun is_active(profile: &ZkLoginProfile): bool {
        profile.is_active
    }

    public fun get_last_login(profile: &ZkLoginProfile): u64 {
        profile.last_login
    }
}