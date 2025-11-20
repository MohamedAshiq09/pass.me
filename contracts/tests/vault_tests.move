#[test_only]
module pass_me::vault_tests {
    use pass_me::vault::{Self, Vault, VaultCap};
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use std::string;

    const ADMIN: address = @0xAD;
    const USER: address = @0xUSER;

    #[test]
    fun test_create_vault() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create clock
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        // Create vault
        vault::create_vault(b"test_walrus_blob_id", &clock, ctx);

        // Check vault was created
        test_scenario::next_tx(&mut scenario, ADMIN);
        assert!(test_scenario::has_most_recent_shared<Vault>(), 0);
        assert!(test_scenario::has_most_recent_for_sender<VaultCap>(&scenario), 0);

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_update_vault() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        // Create vault
        vault::create_vault(b"initial_blob", &clock, ctx);

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut vault = test_scenario::take_shared<Vault>(&scenario);
        let cap = test_scenario::take_from_sender<VaultCap>(&scenario);

        // Update vault
        vault::update_vault(&mut vault, &cap, b"updated_blob", &clock, ctx);

        // Verify update
        assert!(vault::get_walrus_blob_id(&vault) == string::utf8(b"updated_blob"), 0);

        test_scenario::return_shared(vault);
        test_scenario::return_to_sender(&scenario, cap);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_lock_unlock_vault() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        // Create vault
        vault::create_vault(b"test_blob", &clock, ctx);

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut vault = test_scenario::take_shared<Vault>(&scenario);
        let cap = test_scenario::take_from_sender<VaultCap>(&scenario);

        // Lock vault
        vault::lock_vault(&mut vault, &cap, &clock, ctx);
        assert!(vault::is_locked(&vault), 0);

        // Unlock vault
        vault::unlock_vault(&mut vault, &cap, &clock, ctx);
        assert!(!vault::is_locked(&vault), 0);

        test_scenario::return_shared(vault);
        test_scenario::return_to_sender(&scenario, cap);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}