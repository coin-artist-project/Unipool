pragma solidity ^0.5.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./IRewardDistributionRecipient.sol";

contract LPTokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public stakedToken;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount, address caller) public {
        _totalSupply = _totalSupply.add(amount);
        _balances[caller] = _balances[caller].add(amount);
        stakedToken.safeTransferFrom(caller, address(this), amount);
    }

    function withdraw(uint256 amount, address caller) public {
        _totalSupply = _totalSupply.sub(amount);
        _balances[caller] = _balances[caller].sub(amount);
        stakedToken.safeTransfer(caller, amount);
    }
}

contract UnipoolChild is LPTokenWrapper, IRewardDistributionRecipient {
    IERC20 public rewardToken;
    uint256 public constant DURATION = 7 days;

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(IERC20 _stakedToken, IERC20 _rewardToken) public {
        stakedToken = _stakedToken;
        rewardToken = _rewardToken;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
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

    function earned(address account) public view returns (uint256) {
        return
            balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    // stake visibility is public as overriding LPTokenWrapper's stake() function
    function stake(uint256 amount, address caller) public onlyOwner updateReward(caller) {
        require(amount > 0, "Cannot stake 0");
        super.stake(amount, caller);
        emit Staked(caller, amount);
    }

    function withdraw(uint256 amount, address caller) public onlyOwner updateReward(caller) {
        require(amount > 0, "Cannot withdraw 0");
        super.withdraw(amount, caller);
        emit Withdrawn(caller, amount);
    }

    function exit(address caller) public onlyOwner {
        withdraw(balanceOf(caller), caller);
        getReward(caller);
    }

    function getReward(address caller) public onlyOwner updateReward(caller) {
        uint256 reward = earned(caller);
        if (reward > 0) {
            rewards[caller] = 0;
            rewardToken.safeTransfer(caller, reward);
            emit RewardPaid(caller, reward);
        }
    }

    function notifyRewardAmount(uint256 reward)
        external
        onlyRewardDistribution
        updateReward(address(0))
    {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(DURATION);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(DURATION);
        }
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(DURATION);
        emit RewardAdded(reward);
    }
}
