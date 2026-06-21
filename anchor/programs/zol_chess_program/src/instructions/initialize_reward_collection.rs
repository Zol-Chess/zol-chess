use crate::constants::{REWARDS_AUTHORITY_SEED, REWARDS_CONFIG_SEED};
use crate::state::rewards::*;
use crate::ChessErrors;
use anchor_lang::prelude::*;
use mpl_core::instructions::CreateCollectionV2CpiBuilder;
use mpl_core::ID as MPL_CORE_ID;

#[derive(Accounts)]
pub struct InitializeRewardCollection<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub reward_collection: Signer<'info>,
    #[account(
        mut,
        seeds = [ REWARDS_CONFIG_SEED],
        bump = reward_config.bump,
        constraint = reward_config.reward_collection == Pubkey::default() @ChessErrors::RewardCollectionAlreadyInitialized,
        has_one = admin
        )]
    pub reward_config: Account<'info, RewardsConfig>,
    ///CHECK: Account not initialized only used for signing
    #[account(
            seeds = [REWARDS_AUTHORITY_SEED],
            bump
        )]
    pub reward_authority: UncheckedAccount<'info>,
    /// CHECK: This is id of mpl core program
    #[account(address= MPL_CORE_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeRewardCollection<'info> {
    pub fn init_collection(
        &mut self,
        name: String,
        uri: String,
        bumps: InitializeRewardCollectionBumps,
    ) -> Result<()> {
        require!(name.len() <= 64, ChessErrors::MetadataNameTooLong);
        require!(uri.len() <= 200, ChessErrors::MetadataUriTooLong);

        let signer_seeds: &[&[&[u8]]] = &[&[REWARDS_AUTHORITY_SEED, &[bumps.reward_authority]]];

        CreateCollectionV2CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .collection(&self.reward_collection.to_account_info())
            .payer(&self.admin.to_account_info())
            .update_authority(Some(&self.reward_authority.to_account_info()))
            .system_program(&self.system_program.to_account_info())
            .name(name)
            .uri(uri)
            .invoke_signed(signer_seeds)?;

        self.reward_config.reward_collection = self.reward_collection.key();
        self.reward_config.authority_bump = bumps.reward_authority;

        Ok(())
    }
}
