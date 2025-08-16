use anchor_lang::prelude::*;

declare_id!("HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh");

#[program]
pub mod coinflip {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.authority = ctx.accounts.authority.key();
        game_state.total_games = 0;
        game_state.total_volume = 0;
        game_state.house_balance = 0;
        msg!("Doggo Coin Flip Game initialized by: {}", ctx.accounts.authority.key());
        Ok(())
    }

    pub fn flip_coin(
        ctx: Context<FlipCoin>,
        bet_amount: u64,
        choice: u8, // 0 = heads, 1 = tails
    ) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        
        // Validate bet amount (0.1-1 SOL in lamports)
        require!(bet_amount >= 100_000_000, CoinFlipError::InvalidBetAmount); // 0.1 SOL = 100,000,000 lamports
        require!(bet_amount <= 1_000_000_000, CoinFlipError::InvalidBetAmount); // 1 SOL max
        
        // Validate choice
        require!(choice <= 1, CoinFlipError::InvalidChoice);
        
        // Transfer bet amount from user to program escrow
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.game_state.key(),
            bet_amount
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.game_state.to_account_info(),
            ],
        )?;
        
        // Add bet to house balance
        game_state.house_balance += bet_amount;
        
        // Generate random result using clock
        let clock = Clock::get()?;
        let seed = clock.unix_timestamp as u64 + clock.slot;
        let result = seed % 2;
        
        // Determine if user won
        let user_won = choice == result;
        
        if user_won {
            // User wins - transfer 2x bet amount back to user from escrow
            let win_amount = bet_amount * 2;
            
            // Check if house has enough balance
            require!(game_state.house_balance >= win_amount, CoinFlipError::InsufficientHouseBalance);
            
            let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.game_state.key(),
                &ctx.accounts.user.key(),
                win_amount
            );
            
            anchor_lang::solana_program::program::invoke_signed(
                &transfer_instruction,
                &[
                    ctx.accounts.game_state.to_account_info(),
                    ctx.accounts.user.to_account_info(),
                ],
                &[&[
                    b"game_state",
                    &[ctx.bumps.game_state]
                ]],
            )?;
            
            // Subtract win amount from house balance
            game_state.house_balance -= win_amount;
            
            msg!("🎉 User WON! Choice: {}, Result: {}, Win Amount: {} SOL", 
                if choice == 0 { "Heads" } else { "Tails" },
                if result == 0 { "Heads" } else { "Tails" },
                win_amount / 1_000_000_000
            );
        } else {
            msg!("😔 User LOST! Choice: {}, Result: {}, Lost Amount: {} SOL", 
                if choice == 0 { "Heads" } else { "Tails" },
                if result == 0 { "Heads" } else { "Tails" },
                bet_amount / 1_000_000_000
            );
        }
        
        // Update game statistics
        game_state.total_games += 1;
        game_state.total_volume += bet_amount;
        
        Ok(())
    }

    pub fn get_user_balance(ctx: Context<GetBalance>) -> Result<u64> {
        let balance = ctx.accounts.user.lamports();
        msg!("User balance: {} SOL", balance / 1_000_000_000);
        Ok(balance)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8, // Added space for house_balance
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FlipCoin<'info> {
    #[account(
        mut,
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetBalance<'info> {
    pub user: AccountInfo<'info>,
}

#[account]
pub struct GameState {
    pub authority: Pubkey,
    pub total_games: u64,
    pub total_volume: u64,
    pub house_balance: u64,
}

#[error_code]
pub enum CoinFlipError {
    #[msg("Invalid bet amount. Must be between 0.1-1 SOL")]
    InvalidBetAmount,
    #[msg("Invalid choice. Must be 0 (heads) or 1 (tails)")]
    InvalidChoice,
    #[msg("Insufficient house balance to pay winnings")]
    InsufficientHouseBalance,
}
