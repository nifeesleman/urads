// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CampaignEscrow
 * @notice Individual escrow contract for influencer marketing campaigns
 * @dev Holds USDC until campaign completion or timeout
 */
contract CampaignEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =============================================================
    //                           STATE
    // =============================================================
    
    address public immutable brand;           // Brand wallet address
    address public immutable influencer;      // Influencer wallet address
    IERC20 public immutable usdc;             // USDC token contract
    address public immutable treasury;        // UrAds treasury for fees
    uint256 public immutable amount;          // Campaign amount in USDC
    uint256 public immutable deadline;        // Deadline timestamp
    uint256 public immutable feePercent;      // Fee percentage (e.g., 1000 = 10%)
    
    string public deliverableUrl;             // URL of submitted work
    bool public delivered;                    // Has influencer submitted work?
    bool public approved;                     // Has brand approved work?
    bool public claimed;                      // Has timeout been claimed?
    bool public refunded;                     // Has brand been refunded?

    // =============================================================
    //                           EVENTS
    // =============================================================
    
    event WorkSubmitted(address indexed influencer, string url, uint256 timestamp);
    event CampaignApproved(address indexed brand, uint256 influencerPayout, uint256 fee);
    event TimeoutClaimed(address indexed influencer, uint256 payout, uint256 fee);
    event CampaignRefunded(address indexed brand, uint256 amount);

    // =============================================================
    //                          ERRORS
    // =============================================================
    
    error OnlyBrand();
    error OnlyInfluencer();
    error AlreadyDelivered();
    error NotDelivered();
    error AlreadyApproved();
    error AlreadyClaimed();
    error DeadlineNotPassed();
    error DeadlinePassed();
    error AlreadyRefunded();

    // =============================================================
    //                         MODIFIERS
    // =============================================================
    
    modifier onlyBrand() {
        if (msg.sender != brand) revert OnlyBrand();
        _;
    }

    modifier onlyInfluencer() {
        if (msg.sender != influencer) revert OnlyInfluencer();
        _;
    }

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================
    
    /**
     * @param _brand Brand wallet address
     * @param _influencer Influencer wallet address
     * @param _usdc USDC token contract address
     * @param _treasury UrAds treasury address for fees
     * @param _amount Campaign amount in USDC (with decimals)
     * @param _deadline Unix timestamp deadline
     * @param _feePercent Fee percentage (1000 = 10%)
     */
    constructor(
        address _brand,
        address _influencer,
        address _usdc,
        address _treasury,
        uint256 _amount,
        uint256 _deadline,
        uint256 _feePercent
    ) {
        require(_brand != address(0), "Invalid brand");
        require(_influencer != address(0), "Invalid influencer");
        require(_usdc != address(0), "Invalid USDC");
        require(_treasury != address(0), "Invalid treasury");
        require(_amount > 0, "Amount must be > 0");
        require(_deadline > block.timestamp, "Deadline must be future");
        require(_feePercent <= 5000, "Fee too high"); // Max 50%

        brand = _brand;
        influencer = _influencer;
        usdc = IERC20(_usdc);
        treasury = _treasury;
        amount = _amount;
        deadline = _deadline;
        feePercent = _feePercent;
    }

    // =============================================================
    //                     CORE FUNCTIONS
    // =============================================================

    /**
     * @notice Influencer submits their deliverable URL
     * @param url The URL to the completed work (video, post, etc.)
     */
    function submitWork(string calldata url) external onlyInfluencer nonReentrant {
        if (delivered) revert AlreadyDelivered();
        if (block.timestamp > deadline) revert DeadlinePassed();
        
        require(bytes(url).length > 0, "URL required");
        
        deliverableUrl = url;
        delivered = true;
        
        emit WorkSubmitted(msg.sender, url, block.timestamp);
    }

    /**
     * @notice Brand approves the work and releases payment
     * @dev Transfers USDC minus fee to influencer, fee to treasury
     */
    function approve() external onlyBrand nonReentrant {
        if (!delivered) revert NotDelivered();
        if (approved) revert AlreadyApproved();
        if (claimed) revert AlreadyClaimed();
        
        approved = true;
        
        // Calculate fee and payout
        uint256 fee = (amount * feePercent) / 10000;
        uint256 influencerPayout = amount - fee;
        
        // Transfer to influencer and treasury
        usdc.safeTransfer(influencer, influencerPayout);
        usdc.safeTransfer(treasury, fee);
        
        emit CampaignApproved(msg.sender, influencerPayout, fee);
    }

    /**
     * @notice Influencer claims payment if brand doesn't approve by deadline
     * @dev Only callable after deadline if work was delivered but not approved
     */
    function claimTimeout() external onlyInfluencer nonReentrant {
        if (!delivered) revert NotDelivered();
        if (approved) revert AlreadyApproved();
        if (claimed) revert AlreadyClaimed();
        if (block.timestamp <= deadline) revert DeadlineNotPassed();
        
        claimed = true;
        
        // Calculate fee and payout
        uint256 fee = (amount * feePercent) / 10000;
        uint256 influencerPayout = amount - fee;
        
        // Transfer to influencer and treasury
        usdc.safeTransfer(influencer, influencerPayout);
        usdc.safeTransfer(treasury, fee);
        
        emit TimeoutClaimed(msg.sender, influencerPayout, fee);
    }

    /**
     * @notice Brand can request refund if influencer never delivers by deadline
     * @dev Only callable after deadline if work was NOT delivered
     */
    function refund() external onlyBrand nonReentrant {
        if (delivered) revert AlreadyDelivered();
        if (refunded) revert AlreadyRefunded();
        if (block.timestamp <= deadline) revert DeadlineNotPassed();
        
        refunded = true;
        
        // Full refund to brand
        usdc.safeTransfer(brand, amount);
        
        emit CampaignRefunded(msg.sender, amount);
    }

    // =============================================================
    //                       VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Get current campaign status
     * @return _delivered Has work been submitted
     * @return _approved Has brand approved
     * @return _claimed Has timeout been claimed
     * @return _refunded Has brand been refunded
     * @return _deadlinePassed Has deadline passed
     */
    function getStatus() external view returns (
        bool _delivered,
        bool _approved,
        bool _claimed,
        bool _refunded,
        bool _deadlinePassed
    ) {
        return (delivered, approved, claimed, refunded, block.timestamp > deadline);
    }

    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
