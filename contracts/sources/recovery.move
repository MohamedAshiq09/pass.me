module pass_me::recovery {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;

    // ==================== ERRORS ====================
    const ENotOwner: u64 = 1;
    const ERecoveryPending: u64 = 2;
    const ENoRecoveryPending: u64 = 3;
    const EInsufficientApprovals: u64 = 4;

    // ==================== STRUCTS ====================
    public struct RecoveryConfig has key, store {
        id: UID,
        vault_id: ID,
        owner: address,
        guardians: vector<address>,      // Recovery guardians
        recovery_threshold: u64,         // Number of guardians needed
        pending_recovery: bool,
        pending_new_owner: address,
        recovery_approvals: vector<address>,
        initiated_at: u64,
    }

    // ==================== EVENTS ====================
    public struct RecoveryInitiated has copy, drop {
        vault_id: ID,
        old_owner: address,
        new_owner: address,
        timestamp: u64,
    }

    public struct RecoveryApproved has copy, drop {
        vault_id: ID,
        guardian: address,
        approvals: u64,
        timestamp: u64,
    }

    public struct RecoveryCompleted has copy, drop {
        vault_id: ID,
        old_owner: address,
        new_owner: address,
        timestamp: u64,
    }

    // ==================== FUNCTIONS ====================
    /// Create recovery config
    public entry fun create_recovery_config(
        vault_id: ID,
        guardians: vector<address>,
        recovery_threshold: u64,
        ctx: &mut TxContext
    ) {
        let config = RecoveryConfig {
            id: object::new(ctx),
            vault_id,
            owner: tx_context::sender(ctx),
            guardians,
            recovery_threshold,
            pending_recovery: false,
            pending_new_owner: @0x0,
            recovery_approvals: vector::empty<address>(),
            initiated_at: 0,
        };

        transfer::share_object(config);
    }

    /// Initiate recovery
    public entry fun initiate_recovery(
        config: &mut RecoveryConfig,
        new_owner: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!config.pending_recovery, ERecoveryPending);

        config.pending_recovery = true;
        config.pending_new_owner = new_owner;
        config.recovery_approvals = vector::empty<address>();
        config.initiated_at = clock::timestamp_ms(clock);

        event::emit(RecoveryInitiated {
            vault_id: config.vault_id,
            old_owner: config.owner,
            new_owner,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Approve recovery (by guardian)
    public entry fun approve_recovery(
        config: &mut RecoveryConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let guardian = tx_context::sender(ctx);
        assert!(config.pending_recovery, ENoRecoveryPending);

        // Check if guardian is authorized
        assert!(vector::contains(&config.guardians, &guardian), ENotOwner);

        // Add approval if not already approved
        if (!vector::contains(&config.recovery_approvals, &guardian)) {
            vector::push_back(&mut config.recovery_approvals, guardian);
        };

        event::emit(RecoveryApproved {
            vault_id: config.vault_id,
            guardian,
            approvals: vector::length(&config.recovery_approvals),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Complete recovery
    public entry fun complete_recovery(
        config: &mut RecoveryConfig,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(config.pending_recovery, ENoRecoveryPending);
        assert!(
            vector::length(&config.recovery_approvals) >= config.recovery_threshold,
            EInsufficientApprovals
        );

        let old_owner = config.owner;
        config.owner = config.pending_new_owner;
        config.pending_recovery = false;
        config.recovery_approvals = vector::empty<address>();

        event::emit(RecoveryCompleted {
            vault_id: config.vault_id,
            old_owner,
            new_owner: config.owner,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // ==================== GETTERS ====================
    public fun get_owner(config: &RecoveryConfig): address {
        config.owner
    }

    public fun get_guardians(config: &RecoveryConfig): vector<address> {
        config.guardians
    }

    public fun get_recovery_threshold(config: &RecoveryConfig): u64 {
        config.recovery_threshold
    }

    public fun is_recovery_pending(config: &RecoveryConfig): bool {
        config.pending_recovery
    }

    public fun get_approval_count(config: &RecoveryConfig): u64 {
        vector::length(&config.recovery_approvals)
    }
}