/**
 * Smart Contract Configuration
 * 
 * Contains ABIs and addresses for EscrowFactory and CampaignEscrow contracts
 * Configured for Sepolia testnet deployment
 */

// =============================================================
//                    NETWORK CONFIGURATION
// =============================================================

export const SUPPORTED_CHAINS = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
} as const;

export const DEFAULT_CHAIN = SUPPORTED_CHAINS.sepolia;

// =============================================================
//                    CONTRACT ADDRESSES
// =============================================================

/**
 * Contract addresses on Sepolia testnet
 * Update these after deploying your contracts
 */
export const CONTRACT_ADDRESSES = {
  // USDC on Sepolia (Circle's official testnet USDC)
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  
  // EscrowFactory - UPDATE AFTER DEPLOYMENT
  ESCROW_FACTORY: "0x0000000000000000000000000000000000000000",
  
  // UrAds Treasury - UPDATE WITH YOUR TREASURY WALLET
  TREASURY: "0x0000000000000000000000000000000000000000",
} as const;

// =============================================================
//                        USDC ABI
// =============================================================

export const USDC_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Write functions
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

// =============================================================
//                    ESCROW FACTORY ABI
// =============================================================

export const ESCROW_FACTORY_ABI = [
  // Read functions
  "function usdc() view returns (address)",
  "function treasury() view returns (address)",
  "function feePercent() view returns (uint256)",
  "function campaigns(uint256) view returns (address)",
  "function getCampaignCount() view returns (uint256)",
  "function getAllCampaigns() view returns (address[])",
  "function getCampaignsByBrand(address _brand) view returns (address[])",
  "function getCampaignsByInfluencer(address _influencer) view returns (address[])",
  "function getCampaignsPaginated(uint256 _start, uint256 _count) view returns (address[])",
  
  // Write functions
  "function createCampaign(address _influencer, uint256 _amount, uint256 _deadline) returns (address escrow)",
  "function setTreasury(address _treasury)",
  "function setFeePercent(uint256 _feePercent)",
  
  // Events
  "event CampaignCreated(address indexed escrow, address indexed brand, address indexed influencer, uint256 amount, uint256 deadline, uint256 timestamp)",
  "event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury)",
  "event FeeUpdated(uint256 oldFee, uint256 newFee)",
] as const;

// =============================================================
//                   CAMPAIGN ESCROW ABI
// =============================================================

export const CAMPAIGN_ESCROW_ABI = [
  // Read functions
  "function brand() view returns (address)",
  "function influencer() view returns (address)",
  "function usdc() view returns (address)",
  "function treasury() view returns (address)",
  "function amount() view returns (uint256)",
  "function deadline() view returns (uint256)",
  "function feePercent() view returns (uint256)",
  "function deliverableUrl() view returns (string)",
  "function delivered() view returns (bool)",
  "function approved() view returns (bool)",
  "function claimed() view returns (bool)",
  "function refunded() view returns (bool)",
  "function getStatus() view returns (bool _delivered, bool _approved, bool _claimed, bool _refunded, bool _deadlinePassed)",
  "function getBalance() view returns (uint256)",
  
  // Write functions
  "function submitWork(string calldata url)",
  "function approve()",
  "function claimTimeout()",
  "function refund()",
  
  // Events
  "event WorkSubmitted(address indexed influencer, string url, uint256 timestamp)",
  "event CampaignApproved(address indexed brand, uint256 influencerPayout, uint256 fee)",
  "event TimeoutClaimed(address indexed influencer, uint256 payout, uint256 fee)",
  "event CampaignRefunded(address indexed brand, uint256 amount)",
] as const;

// =============================================================
//                        HELPERS
// =============================================================

/**
 * USDC has 6 decimals
 */
export const USDC_DECIMALS = 6;

/**
 * Parse USDC amount to BigInt with proper decimals
 */
export function parseUSDC(amount: string | number): bigint {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.round(value * 10 ** USDC_DECIMALS));
}

/**
 * Format USDC amount from BigInt to human-readable string
 */
export function formatUSDC(amount: bigint): string {
  return (Number(amount) / 10 ** USDC_DECIMALS).toFixed(2);
}

/**
 * Convert fee percentage to human-readable format
 * @param feePercent Fee in basis points (1000 = 10%)
 */
export function formatFeePercent(feePercent: number): string {
  return `${feePercent / 100}%`;
}
