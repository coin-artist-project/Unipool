pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract ERC20Token is ERC20Detailed, ERC20, Ownable
{
	constructor(string memory _name, string memory _symbol)
		ERC20Detailed(_name, _symbol, 18)
		public
	{
		_mint(msg.sender, 1000000 ether);
	}

	function mint(address account, uint256 amount) public onlyOwner
	{
		_mint(account, amount);
	}
}