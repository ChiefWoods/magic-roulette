use anchor_lang::{
    prelude::*,
    solana_program::native_token::LAMPORTS_PER_SOL,
    system_program::{transfer, Transfer},
};

use crate::{Round, Table, ROUND_SEED, TABLE_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct InitializeTable<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: Vault for holding round bet amounts, system account
    #[account(

        mut,
        seeds = [VAULT_SEED],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,
    #[account(
        init,
        payer = admin,
        space = Table::DISCRIMINATOR.len()+ Table::INIT_SPACE,
        seeds = [TABLE_SEED],
        bump,
    )]
    pub table: Account<'info, Table>,
    #[account(
        init,
        payer = admin,
        space = Round::DISCRIMINATOR.len() + Round::INIT_SPACE,
        seeds = [ROUND_SEED],
        bump,
    )]
    pub round: Account<'info, Round>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeTable<'info> {
    pub fn initialize_table(
        &mut self,
        bumps: &InitializeTableBumps,
        minimum_bet_amount: u64,
        round_period_ts: u64,
    ) -> Result<()> {
        // current timestamp
        let current_timestamp = Clock::get()?.unix_timestamp;

        //  initialize table and round accounts
        self.table.set_inner(Table {
            admin: self.admin.key(),
            minimum_bet_amount,
            current_round_number: 1,
            // 90s until the next round.
            next_round_ts: current_timestamp + round_period_ts as i64,
            round_period_ts,
            bump: bumps.table,
            vault_bump: bumps.vault,
        });

        // initialsing a round
        self.round.set_inner(Round {
            round_number: 1,
            pool_amount: 0,
            is_spun: false,
            is_claimed: false,
            bump: bumps.round,
            winning_bet: None,
        });

        // TODO: transfer minimum system account rent to vault, to prevent it from being under-rent when winnings are first drawn
        let min_rent_lamports = Rent::get()?.minimum_balance(0);

        //cpi for account creation with rent
        let cpi_ctx = CpiContext::new(
            self.system_program.to_account_info(),
            Transfer {
                from: self.admin.to_account_info(),
                to: self.vault.to_account_info(),
            },
        );

        transfer(cpi_ctx, min_rent_lamports)?;

        Ok(())
    }
}
