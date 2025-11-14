use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{error::MagicRouletteError, Table, TABLE_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct WithdrawVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: Vault for holding round bet amounts, system account
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = table.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,
    #[account(
        seeds = [TABLE_SEED],
        bump = table.bump,
        has_one = admin @ MagicRouletteError::UnauthorizedAdmin
    )]
    pub table: Account<'info, Table>,
    pub system_program: Program<'info, System>,
}

impl<'info> WithdrawVault<'info> {
    pub fn handler(&mut self, amount: Option<u64>) -> Result<()> {
        let min_rent = Rent::get()?.minimum_balance(0);
        let withdrawable_amount = self.vault.lamports().saturating_sub(min_rent);

        let amount = if let Some(amount) = amount {
            require!(
                amount <= withdrawable_amount,
                MagicRouletteError::VaultNotWithdrawable
            );

            amount
        } else {
            withdrawable_amount
        };

        let vault_seeds: &[&[u8]] = &[VAULT_SEED, &[self.table.vault_bump]];

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.vault.to_account_info(),
                    to: self.admin.to_account_info(),
                },
            )
            .with_signer(&[vault_seeds]),
            amount,
        )?;

        Ok(())
    }
}
