#[test_only]
module pass_me::password_entry_tests {
    use pass_me::password_entry::{Self, PasswordEntry};
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use sui::object;

    const ADMIN: address = @0xAD;
    const USER: address = @0xUSER;

    #[test]
    fun test_create_password_entry() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        let vault_id = object::id_from_address(@0x1);
        let domain_hash = x"1234567890123456789012345678901234567890123456789012345678901234"; // 32 bytes
        let password_hash = x"abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef";
        let device_id = b"device_123";

        // Create password entry
        password_entry::create_entry(
            vault_id,
            domain_hash,
            password_hash,
            device_id,
            &clock,
            ctx
        );

        // Check entry was created
        test_scenario::next_tx(&mut scenario, ADMIN);
        assert!(test_scenario::has_most_recent_shared<PasswordEntry>(), 0);

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_record_usage() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        let vault_id = object::id_from_address(@0x1);
        let domain_hash = x"1234567890123456789012345678901234567890123456789012345678901234";
        let password_hash = x"abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef";
        let device_id = b"device_123";

        // Create password entry
        password_entry::create_entry(
            vault_id,
            domain_hash,
            password_hash,
            device_id,
            &clock,
            ctx
        );

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut entry = test_scenario::take_shared<PasswordEntry>(&scenario);

        // Record usage
        password_entry::record_usage(&mut entry, device_id, &clock, ctx);

        // Verify usage count increased
        assert!(password_entry::get_usage_count(&entry) == 1, 0);

        test_scenario::return_shared(entry);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_add_device() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        let vault_id = object::id_from_address(@0x1);
        let domain_hash = x"1234567890123456789012345678901234567890123456789012345678901234";
        let password_hash = x"abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef";
        let device_id = b"device_123";

        // Create password entry
        password_entry::create_entry(
            vault_id,
            domain_hash,
            password_hash,
            device_id,
            &clock,
            ctx
        );

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut entry = test_scenario::take_shared<PasswordEntry>(&scenario);

        // Add new device
        let new_device_id = b"device_456";
        password_entry::add_device(&mut entry, new_device_id, &clock, ctx);

        // Verify device was added (whitelist should have 2 devices now)
        let whitelist = password_entry::get_device_whitelist(&entry);
        assert!(std::vector::length(&whitelist) == 2, 0);

        test_scenario::return_shared(entry);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}