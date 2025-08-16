# CoinFlip Solana Program

This directory contains the Solana smart contract for the CoinFlip application built with Anchor framework.

## Structure

- `programs/coinflip/` - The main program source code
- `tests/` - Test files for the program
- `Cargo.toml` - Rust workspace configuration
- `Anchor.toml` - Anchor framework configuration (located in project root)

## Program Features

The program includes a simple `flip_coin` instruction that:
- Generates a pseudo-random result (heads or tails)
- Uses Solana's clock as a seed for randomness
- Logs the result to the transaction

## Development

### Prerequisites

- Rust and Cargo
- Solana CLI
- Anchor CLI
- Node.js and Yarn

### Building

```bash
cd program
anchor build
```

### Testing

```bash
anchor test
```

### Deploying to Devnet

```bash
anchor deploy --provider.cluster devnet
```

## Frontend Integration

The program is designed to be integrated with the frontend using `@solana/web3.js`. The main instruction to call is:

- `flip_coin()` - Flips a coin and returns heads or tails

## Program ID

The program ID is: `HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh`

Note: This ID will change when deployed to devnet/mainnet.
