pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "./UnipoolChild.sol";

contract UnipoolFarms is Ownable {

    UnipoolChild[] public farms;

    event AddedUnipoolFarm(uint256 indexed farmId, address farmAddress, address stakedToken, address rewardToken);

    modifier farmExists(uint256 farmId) {
        require(farmId < farms.length, "Invalid farm ID");
        _;
    }

    function createFarm(IERC20 stakedToken, IERC20 rewardToken)
        external
        onlyOwner
        returns (uint256)
    {
        UnipoolChild farm = new UnipoolChild(stakedToken, rewardToken);
        farm.setRewardDistribution(address(this));
        farms.push(farm);
        emit AddedUnipoolFarm(farms.length - 1, address(farms[farms.length - 1]), address(stakedToken), address(rewardToken));
        return farms.length - 1;
    }

    function getFarmAddress(uint256 farmId)
        external
        view
        farmExists(farmId)
        returns (address)
    {
        return address(farms[farmId]);
    }

    /*
    function switchFarm(uint256 farmIdFrom, uint256 farmIdTo) {

    }
    */

    /**
     * Delegate functions to all of the farms
     **/

    function totalSupply(uint256 farmId)
        public
        view
        farmExists(farmId)
        returns (uint256)
    {    
        return farms[farmId].totalSupply();
    }

    function balanceOf(uint256 farmId, address account)
        public
        view
        farmExists(farmId)
        returns (uint256)
    {
        return farms[farmId].balanceOf(account);
    }

    function lastTimeRewardApplicable(uint256 farmId)
        public
        view
        farmExists(farmId)
        returns (uint256)
    {
        return farms[farmId].lastTimeRewardApplicable();
    }

    function rewardPerToken(uint256 farmId)
        public
        view
        farmExists(farmId)
        returns (uint256)
    {
        return farms[farmId].rewardPerToken();
    }

    function earned(uint256 farmId, address account)
        public
        view
        farmExists(farmId)
        returns (uint256)
    {
        return farms[farmId].earned(account);
    }

    function stake(uint256 farmId, uint256 amount)
        public
        farmExists(farmId)
    {
        //(bool success, bytes memory _) = address(farms[farmId]).call(abi.encodeWithSignature("stake(uint256)", amount));
        //require (success, "Failure to call");
        return farms[farmId].stake(amount, msg.sender);
    }

    function withdraw(uint256 farmId, uint256 amount)
        public
        farmExists(farmId)
    {
        //(bool success, bytes memory _) = address(farms[farmId]).call(abi.encodeWithSignature("withdraw(uint256)", amount));
        //require (success, "Failure to call");
        return farms[farmId].withdraw(amount, msg.sender);
    }

    function exit(uint256 farmId)
        external
        farmExists(farmId)
    {
        //(bool success, bytes memory _) = address(farms[farmId]).call(abi.encodeWithSignature("exit()"));
        //require (success, "Failure to call");
        return farms[farmId].exit(msg.sender);
    }

    function getReward(uint256 farmId)
        public
        farmExists(farmId)
    {
        //(bool success, bytes memory _) = address(farms[farmId]).call(abi.encodeWithSignature("getReward()"));
        //require (success, "Failure to call");
        return farms[farmId].getReward(msg.sender);
    }

    function notifyRewardAmount(uint256 farmId, uint256 reward)
        external
        onlyOwner
        farmExists(farmId)
    {
        //(bool success, bytes memory result) = address(farms[farmId]).call(abi.encodeWithSignature("notifyRewardAmount(uint256)", reward));
        //return abi.decode(result, (uint256));
        return farms[farmId].notifyRewardAmount(reward);
    }

}
