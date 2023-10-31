// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Lock {
    // external, internal, view 
    
    struct ContractInformation {
        uint256 totalDeposits;
        uint256 totalDepositsAmount;
        uint256 totalUsers;
        uint256 totalWithdraws;
        uint256 totalWithdrawsAmount;
    }

    uint constant unlockTime = 60;
    ContractInformation public contractInfo;


    mapping (address => uint256) ownerBalances;
    mapping (address => uint256) userUnlockTimestamp;
    mapping (address => address) approvedUsers;


    event Withdrawal(address indexed to, address indexed operator, uint amount, uint when);
    event Deposit(address indexed owner, uint depositAmount, uint newUnlock);
    event WithdrawalPercentage(address indexed owner,address indexed operator, uint amount, uint when);


    constructor()  {
        contractInfo.totalDeposits = 0;
        contractInfo.totalUsers = 0;
        contractInfo.totalWithdraws = 0;
        contractInfo.totalDepositsAmount =0;
        contractInfo.totalWithdrawsAmount = 0;
    }

    modifier onlyOwnerOrApproved(address owner) {
        require(msg.sender == owner || msg.sender == approvedUsers[owner], "User is not the owner or is approved");
        _;
    }

    /**
        @notice Users deposit money and updates unlock timestamp
    **/
    function deposit(address owner) payable external onlyOwnerOrApproved(owner){
        if(isNewUser(owner)){
            contractInfo.totalUsers++;
        }
        uint256 value = msg.value;
        ownerBalances[owner] += value;
        userUnlockTimestamp[owner] = block.timestamp + unlockTime;
        contractInfo.totalDeposits++;
        contractInfo.totalDepositsAmount += value;

        emit Deposit(owner, value, userUnlockTimestamp[msg.sender]);
    }
    
    function approve(address user) external{
        approvedUsers[msg.sender] = user;
    }

    function revokeApprove() external {
        // delete approvedUsers[msg.sender];
         approvedUsers[msg.sender] = address(0);
    }

    function withdraw(address owner) public onlyOwnerOrApproved(owner) {
        require(checkWithdrawCondition(), "You cant withdraw yet");
        uint amount = ownerBalances[owner];
        ownerBalances[owner] = 0;
        contractInfo.totalWithdraws++;
        contractInfo.totalWithdrawsAmount += amount;
        emit Withdrawal(owner, msg.sender, amount, block.timestamp);

        payable(owner).transfer(amount);
    }

    function withdrawPercentage(address owner, uint256 percentage) public onlyOwnerOrApproved(owner){
        require(percentage <=100, "percentage is over 100%");
        require(checkWithdrawCondition(), "You can't withdraw yet");
        require(ownerBalances[owner] >0, "Balance is empty");
        uint amount = ownerBalances[owner];
        uint withdrawAmount = (amount * percentage)/100 ;
        ownerBalances[owner]-= withdrawAmount;
        contractInfo.totalWithdraws++;
        contractInfo.totalWithdrawsAmount += withdrawAmount;
        emit WithdrawalPercentage(owner, msg.sender, withdrawAmount, block.timestamp);
        payable(owner).transfer(withdrawAmount);

    }


    function checkWithdrawCondition() internal view returns (bool){
        return block.timestamp >= userUnlockTimestamp[msg.sender];
    }

    // Doesn't count approved users as users. Only users that have balance on the contract.
    function isNewUser(address user) internal view returns (bool) {
        return ownerBalances[user] == 0 && userUnlockTimestamp[user] == 0;
    }

    function getBalance(address user) external view returns (uint256){
        return ownerBalances[user];
    }

    function getOpperators(address user) external view returns (address){
        return approvedUsers[user];
    }

    function getTimestamp(address user) external view returns (uint256){
        return userUnlockTimestamp[user];
    }

    function getTotalUsers() external view returns (uint256){
        return contractInfo.totalUsers;
    }

    function getTotalWithdrawAmount() external view returns (uint256){
        return contractInfo.totalWithdrawsAmount;
    }

    function getTotalDepositAmount() external view returns (uint256){
        return contractInfo.totalDepositsAmount;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
