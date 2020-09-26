pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract Cred is ERC20Mintable, ERC20Detailed {
	constructor () public ERC20Detailed("Street Cred", "CRED", 18) {}
}
