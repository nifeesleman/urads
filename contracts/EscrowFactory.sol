// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CampaignEscrow.sol";

/**
 * @title EscrowFactory
 * @notice Factory contract to deploy individual CampaignEscrow contracts
 * @dev Manages campaign creation and tracks all deployed escrows
 */
contract EscrowFactory is Ownable {
    using SafeERC20 for IERC20;

    // =============================================================
    //                           STATE
    // =============================================================
    
    IERC20 public immutable usdc;             // USDC token contract
    address public treasury;                  // UrAds treasury for fees
    uint256 public feePercent = 1000;         // Default 10% fee (1000/10000)
    
    // All deployed campaign escrows
    address[] public campaigns;
    
    // Mapping: brand address => their campaigns
    mapping(address => address[]) public brandCampaigns;
    
    // Mapping: influencer address => their campaigns
    mapping(address => address[]) public influencerCampaigns;

    // =============================================================
    //                           EVENTS
    // =============================================================
    
    event CampaignCreated(
        address indexed escrow,
        address indexed brand,
        address indexed influencer,
        uint256 amount,
        uint256 deadline,
        uint256 timestamp
    );
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================
    
    /**
     * @param _usdc USDC token contract address
     * @param _treasury Initial treasury address for fees
     */
    constructor(address _usdc, address _treasury) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        require(_treasury != address(0), "Invalid treasury");
        
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    // =============================================================
    //                     CORE FUNCTIONS
    // =============================================================

    /**
     * @notice Create a new campaign escrow
     * @param _influencer Influencer wallet address
     * @param _amount Campaign amount in USDC (with decimals)
     * @param _deadline Unix timestamp deadline
     * @return escrow Address of the deployed CampaignEscrow contract
     * 
     * @dev Caller (brand) must have approved USDC spending before calling
     */
    function createCampaign(
        address _influencer,
        uint256 _amount,
        uint256 _deadline
    ) external returns (address escrow) {
        require(_influencer != address(0), "Invalid influencer");
        require(_influencer != msg.sender, "Cannot be own influencer");
        require(_amount > 0, "Amount must be > 0");
        require(_deadline > block.timestamp, "Deadline must be future");

        // Deploy new escrow contract
        CampaignEscrow campaign = new CampaignEscrow(
            msg.sender,      // brand
            _influencer,     // influencer
            address(usdc),   // USDC token
            treasury,        // treasury for fees
            _amount,         // amount
            _deadline,       // deadline
            feePercent       // fee percentage
        );
        
        escrow = address(campaign);
        
        // Track the campaign
        campaigns.push(escrow);
        brandCampaigns[msg.sender].push(escrow);
        influencerCampaigns[_influencer].push(escrow);
        
        // Transfer USDC from brand to escrow
        usdc.safeTransferFrom(msg.sender, escrow, _amount);
        
        emit CampaignCreated(
            escrow,
            msg.sender,
            _influencer,
            _amount,
            _deadline,
            block.timestamp
        );
        
        return escrow;
    }

    // =============================================================
    //                      ADMIN FUNCTIONS
    // =============================================================

    /**
     * @notice Update treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        
        address oldTreasury = treasury;
        treasury = _treasury;
        
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /**
     * @notice Update fee percentage
     * @param _feePercent New fee percentage (1000 = 10%)
     */
    function setFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 5000, "Fee too high"); // Max 50%
        
        uint256 oldFee = feePercent;
        feePercent = _feePercent;
        
        emit FeeUpdated(oldFee, _feePercent);
    }

    // =============================================================
    //                       VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Get total number of campaigns
     */
    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    /**
     * @notice Get all campaigns
     */
    function getAllCampaigns() external view returns (address[] memory) {
        return campaigns;
    }

    /**
     * @notice Get campaigns by brand
     */
    function getCampaignsByBrand(address _brand) external view returns (address[] memory) {
        return brandCampaigns[_brand];
    }

    /**
     * @notice Get campaigns by influencer
     */
    function getCampaignsByInfluencer(address _influencer) external view returns (address[] memory) {
        return influencerCampaigns[_influencer];
    }

    /**
     * @notice Get paginated campaigns
     * @param _start Start index
     * @param _count Number of campaigns to return
     */
    function getCampaignsPaginated(uint256 _start, uint256 _count) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 end = _start + _count;
        if (end > campaigns.length) {
            end = campaigns.length;
        }
        
        address[] memory result = new address[](end - _start);
        for (uint256 i = _start; i < end; i++) {
            result[i - _start] = campaigns[i];
        }
        
        return result;
    }
}
