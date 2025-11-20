#[test_only]
module pass_me::recovery_tests {
    use pass_me::recovery::{Self, RecoveryConfig};
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use sui::object;
    use std::vector;

    const ADMIN: address = @0xAD;
    const GUARDIAN1: address = @0xG1;
    const GUARDIAN2: address = @0xG2;
    const NEW_OWNER: address = @0xNEW;

    #[test]
    fun test_create_recovery_config() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let vault_id = object::id_from_address(@0x1);
        let mut guardians = vector::empty<address>();
        vector::push_back(&mut guardians, GUARDIAN1);
        vector::push_back(&mut guardians, GUARDIAN2);

        // Create recovery config
        recovery::create_recovery_config(vault_id, guardians, 2, ctx);

        // Check config was created
        test_scenario::next_tx(&mut scenario, ADMIN);
        assert!(test_scenario::has_most_recent_shared<RecoveryConfig>(), 0);

        test_scenario::end(scenario);
    }

    #[test]
    fun test_recovery_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, 1000);

        let vault_id = object::id_from_address(@0x1);
        let mut guardians = vector::empty<address>();
        vector::push_back(&mut guardians, GUARDIAN1);
        vector::push_back(&mut guardians, GUARDIAN2);

        // Create recovery config
        recovery::create_recovery_config(vault_id, guardians, 2, ctx);

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut config = test_scenario::take_shared<RecoveryConfig>(&scenario);

        // Initiate recovery
        recovery::initiate_recovery(&mut config, NEW_OWNER, &clock, ctx);
        assert!(recovery::is_recovery_pending(&config), 0);

        // Guardian 1 approves
        test_scenario::next_tx(&mut scenario, GUARDIAN1);
        recovery::approve_recovery(&mut config, &clock, test_scenario::ctx(&mut scenario));
        assert!(recovery::get_approval_count(&config) == 1, 0);

        // Guardian 2 approves
        test_scenario::next_tx(&mut scenario, GUARDIAN2);
        recovery::approve_recovery(&mut config, &clock, test_scenario::ctx(&mut scenario));
        assert!(recovery::get_approval_count(&config) == 2, 0);

        // Complete recovery
        recovery::complete_recovery(&mut config, &clock, test_scenario::ctx(&mut scenario));
        assert!(!recovery::is_recovery_pending(&config), 0);
        assert!(recovery::get_owner(&config) == NEW_OWNER, 0);

        test_scenario::return_shared(config);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}