import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Coinflip } from "../target/types/coinflip";

describe("coinflip", () => {
  // Configure the client to use the devnet cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.coinflip as Program<Coinflip>;

  it("Can flip a coin!", async () => {
    // Test the coin flip functionality
    const tx = await program.methods.flipCoin().rpc();
    console.log("Coin flip transaction signature", tx);
  });
});
