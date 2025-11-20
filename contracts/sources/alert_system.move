module pass_me::alert_system {
    use sui::event;
    use sui::object::ID;
    use std::vector;

    // ==================== EVENTS ====================
    public struct LoginAttempt has copy, drop {
        vault_id: ID,
        domain_hash: vector<u8>,
        device_id: vector<u8>,
        ip_hash: vector<u8>,
        timestamp: u64,
        success: bool,
    }

    public struct SuspiciousActivity has copy, drop {
        vault_id: ID,
        entry_id: ID,
        domain_hash: vector<u8>,
        device_id: vector<u8>,
        reason: vector<u8>,          // "UNKNOWN_DEVICE", "NEW_LOCATION", "UNUSUAL_TIME"
        timestamp: u64,
        severity: u8,                // 1=Low, 2=Medium, 3=High, 4=Critical
    }

    public struct PasswordBreach has copy, drop {
        vault_id: ID,
        entry_id: ID,
        domain_hash: vector<u8>,
        timestamp: u64,
    }

    public struct UnauthorizedAccess has copy, drop {
        vault_id: ID,
        device_id: vector<u8>,
        ip_hash: vector<u8>,
        timestamp: u64,
    }

    // ==================== FUNCTIONS ====================
    /// Emit login attempt event
    public fun emit_login_attempt(
        vault_id: ID,
        domain_hash: vector<u8>,
        device_id: vector<u8>,
        ip_hash: vector<u8>,
        timestamp: u64,
        success: bool,
    ) {
        event::emit(LoginAttempt {
            vault_id,
            domain_hash,
            device_id,
            ip_hash,
            timestamp,
            success,
        });
    }

    /// Emit suspicious activity alert
    public fun emit_suspicious_activity(
        vault_id: ID,
        entry_id: ID,
        domain_hash: vector<u8>,
        device_id: vector<u8>,
        reason: vector<u8>,
        timestamp: u64,
        severity: u8,
    ) {
        event::emit(SuspiciousActivity {
            vault_id,
            entry_id,
            domain_hash,
            device_id,
            reason,
            timestamp,
            severity,
        });
    }

    /// Emit password breach alert
    public fun emit_password_breach(
        vault_id: ID,
        entry_id: ID,
        domain_hash: vector<u8>,
        timestamp: u64,
    ) {
        event::emit(PasswordBreach {
            vault_id,
            entry_id,
            domain_hash,
            timestamp,
        });
    }

    /// Emit unauthorized access alert
    public fun emit_unauthorized_access(
        vault_id: ID,
        device_id: vector<u8>,
        ip_hash: vector<u8>,
        timestamp: u64,
    ) {
        event::emit(UnauthorizedAccess {
            vault_id,
            device_id,
            ip_hash,
            timestamp,
        });
    }
}