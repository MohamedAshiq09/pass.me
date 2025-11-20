module pass_me::access_control {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;

    // ==================== ERRORS ====================
    const ENotAuthorized: u64 = 1;
    const EDeviceAlreadyExists: u64 = 2;

    // ==================== STRUCTS ====================
    public struct DeviceRegistry has key, store {
        id: UID,
        vault_id: ID,
        devices: vector<Device>,
    }

    public struct Device has store, drop, copy {
        device_id: vector<u8>,
        device_name: vector<u8>,      // "iPhone 15 Pro", "Chrome on MacBook"
        added_at: u64,
        last_seen: u64,
        is_trusted: bool,
    }

    // ==================== EVENTS ====================
    public struct DeviceRegistered has copy, drop {
        vault_id: ID,
        device_id: vector<u8>,
        timestamp: u64,
    }

    public struct DeviceRevoked has copy, drop {
        vault_id: ID,
        device_id: vector<u8>,
        timestamp: u64,
    }

    // ==================== FUNCTIONS ====================
    /// Create device registry
    public entry fun create_registry(
        vault_id: ID,
        ctx: &mut TxContext
    ) {
        let registry = DeviceRegistry {
            id: object::new(ctx),
            vault_id,
            devices: vector::empty<Device>(),
        };

        transfer::share_object(registry);
    }

    /// Register new device
    public entry fun register_device(
        registry: &mut DeviceRegistry,
        device_id: vector<u8>,
        device_name: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        let device = Device {
            device_id,
            device_name,
            added_at: timestamp,
            last_seen: timestamp,
            is_trusted: true,
        };

        vector::push_back(&mut registry.devices, device);

        event::emit(DeviceRegistered {
            vault_id: registry.vault_id,
            device_id,
            timestamp,
        });
    }

    /// Revoke device access
    public entry fun revoke_device(
        registry: &mut DeviceRegistry,
        device_id: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let len = vector::length(&registry.devices);
        let mut i = 0;
        while (i < len) {
            let device = vector::borrow_mut(&mut registry.devices, i);
            if (device.device_id == device_id) {
                device.is_trusted = false;
                event::emit(DeviceRevoked {
                    vault_id: registry.vault_id,
                    device_id,
                    timestamp: clock::timestamp_ms(clock),
                });
                break
            };
            i = i + 1;
        };
    }

    /// Update last seen
    public fun update_last_seen(
        registry: &mut DeviceRegistry,
        device_id: &vector<u8>,
        clock: &Clock,
    ) {
        let len = vector::length(&registry.devices);
        let mut i = 0;
        while (i < len) {
            let device = vector::borrow_mut(&mut registry.devices, i);
            if (&device.device_id == device_id) {
                device.last_seen = clock::timestamp_ms(clock);
                break
            };
            i = i + 1;
        };
    }

    /// Check if device is trusted
    public fun is_device_trusted(registry: &DeviceRegistry, device_id: &vector<u8>): bool {
        let len = vector::length(&registry.devices);
        let mut i = 0;
        while (i < len) {
            let device = vector::borrow(&registry.devices, i);
            if (&device.device_id == device_id && device.is_trusted) {
                return true
            };
            i = i + 1;
        };
        false
    }

    // ==================== GETTERS ====================
    public fun get_vault_id(registry: &DeviceRegistry): ID {
        registry.vault_id
    }

    public fun get_devices(registry: &DeviceRegistry): vector<Device> {
        registry.devices
    }
}