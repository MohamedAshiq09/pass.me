#[test_only]
module pass_me::access_control_tests {
    use pass_me::access_control::{Self, DeviceRegistry};
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use sui::object;

    const ADMIN: address = @0xAD;

    #[test]
    fun test_create_registry() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let vault_id = object::id_from_address(@0x1);

        // Create device registry
        access_control::create_registry(vault_id, ctx);

        // Check registry was created
        test_scenario::next_tx(&mut scenario, ADMIN);
        assert!(test_scenario::has_most_recent_shared<DeviceRegistry>(), 0);

        test_scenario::end(scenario);
    }

    #[test]
    fun test_register_device() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        let vault_id = object::id_from_address(@0x1);

        // Create device registry
        access_control::create_registry(vault_id, ctx);

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut registry = test_scenario::take_shared<DeviceRegistry>(&scenario);

        // Register device
        let device_id = b"device_123";
        let device_name = b"iPhone 15 Pro";
        access_control::register_device(&mut registry, device_id, device_name, &clock, ctx);

        // Verify device is trusted
        assert!(access_control::is_device_trusted(&registry, &device_id), 0);

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_revoke_device() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        let vault_id = object::id_from_address(@0x1);

        // Create device registry
        access_control::create_registry(vault_id, ctx);

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut registry = test_scenario::take_shared<DeviceRegistry>(&scenario);

        // Register device
        let device_id = b"device_123";
        let device_name = b"iPhone 15 Pro";
        access_control::register_device(&mut registry, device_id, device_name, &clock, ctx);

        // Verify device is trusted
        assert!(access_control::is_device_trusted(&registry, &device_id), 0);

        // Revoke device
        access_control::revoke_device(&mut registry, device_id, &clock, ctx);

        // Verify device is no longer trusted
        assert!(!access_control::is_device_trusted(&registry, &device_id), 0);

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}