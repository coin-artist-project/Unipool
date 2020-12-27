pragma solidity ^0.5.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./IRewardDistributionRecipient.sol";

contract LPTokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public uni = IERC20(0xCCE852e473eCfDEBFD6d3fD5BaE9e964fd2A3Fa7); // Modified

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        uni.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        uni.safeTransfer(msg.sender, amount);
    }
}

contract Unipool is LPTokenWrapper, IRewardDistributionRecipient {
    IERC20 public coin = IERC20(0x87b008E57F640D94Ee44Fd893F0323AF933F9195); // Modified
    IERC20 public cred = IERC20(0xED7Fa212E100DFb3b13B834233E4B680332a3420); // Modified
    uint256 public CREDPERCOINMULTIPLIER = 100; // Modified
    uint256 public DURATION = 30 days; // Modified

    uint256 public periodFinish = 0;
    uint256 public lastUpdateTime;

    // COIN
    uint256 public rewardRate = 0;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // CRED
    uint256 public cred_rewardRate = 0;
    uint256 public cred_rewardPerTokenStored;
    mapping(address => uint256) public cred_userRewardPerTokenPaid;
    mapping(address => uint256) public cred_rewards;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(IERC20 uniToken, IERC20 coinToken, IERC20 credToken) public { // Modified
        uni = uniToken; // Modified
        coin = coinToken; // Modified
        cred = credToken; // Modified
    } // Modified

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        cred_rewardPerTokenStored = cred_rewardPerToken();

        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;

            cred_rewards[account] = cred_earned(account);
            cred_userRewardPerTokenPaid[account] = cred_rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function cred_rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return cred_rewardPerTokenStored;
        }
        return
            cred_rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(cred_rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address account) public view returns (uint256) {
        return
            balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    function cred_earned(address account) public view returns (uint256) {
        return
            balanceOf(account)
                .mul(cred_rewardPerToken().sub(cred_userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(cred_rewards[account]);
    }

    // stake visibility is public as overriding LPTokenWrapper's stake() function
    function stake(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(balanceOf(msg.sender));
        getReward();
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        uint256 cred_reward = cred_earned(msg.sender);

        if (reward > 0) {
            rewards[msg.sender] = 0;
            coin.safeTransfer(msg.sender, reward); // Modified
            emit RewardPaid(msg.sender, reward);
        }

        if (cred_reward > 0 && cred.balanceOf(address(this)) >= cred_reward) {
            cred_rewards[msg.sender] = 0;
            cred.safeTransfer(msg.sender, cred_reward); // Modified
        }
    }

    function setPeriodDuration(uint256 _duration)
        external onlyRewardDistribution // Modified
    { // Modified
        require(periodFinish < now, "Period is not yet over"); // Modified
        require(_duration >= 1, "Invalid duration"); // Modified
        DURATION = _duration; // Modified
    } // Modified

    function setCredMultiplier(uint256 multiplier)
        external onlyRewardDistribution // Modified
    { // Modified
        require(multiplier >= 1, "Invalid CRED multiplier"); // Modified
        CREDPERCOINMULTIPLIER = multiplier; // Modified
    } // Modified

    function notifyRewardAmount(uint256 reward)
        external
        onlyRewardDistribution
        updateReward(address(0))
    {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(DURATION);
            cred_rewardRate = reward.mul(CREDPERCOINMULTIPLIER).div(DURATION);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);

            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(DURATION);

            uint256 cred_leftover = remaining.mul(cred_rewardRate);
            cred_rewardRate = reward.mul(CREDPERCOINMULTIPLIER).add(cred_leftover).div(DURATION);
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(DURATION);
        emit RewardAdded(reward);
    }
}
