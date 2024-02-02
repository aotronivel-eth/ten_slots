// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Slots {
    address private owner;
    uint256 private devLiquidity;
    uint256 private seed;
    uint256 public nonce;
    uint256 public lastWinnngNonce;

    bool public fixedMultipliers;
    uint256 public devFeeBasisPoints = 100;
    uint256 private maxMultiplier;
    uint256 private totalActiveMultipliers;
    uint256 private totalActiveCombinations;

    uint256 public constant BASE = 100;
    uint256 public constant REELS = 3;
    uint256 public constant SYMBOLS = 10;
    uint256 public constant TOTAL_COMBINATIONS = SYMBOLS ** REELS;

    mapping(uint256 => uint256) private payoutMultipliers;

    error NotOwner();
    error NoBalance();
    error WrongBet();
    error InvalidMultiplier();
    error HigherFee();
    error FixedMultipliers();

    event SpinResult(
        address indexed player,
        uint256[REELS] spinners,
        uint256 payout,
        uint256 multiplier,
        uint256 treasury
    );

    constructor() {
        owner = msg.sender;
        seed = block.prevrandao;
    }

    function getMultiplierForCombination(
        uint256[REELS] memory combination
    ) public view returns (uint256) {
        uint256 result = _mapCombinationToResult(combination);
        return payoutMultipliers[result];
    }

    function houseEdge() public view returns (int256) {
        return
            (-1 *
                int256(BASE) *
                (int256(totalActiveMultipliers) -
                    (int256(devFeeBasisPoints) *
                        int256(totalActiveCombinations)) -
                    int256(TOTAL_COMBINATIONS * BASE))) /
            int256(TOTAL_COMBINATIONS);
    }

    function spinReel() external payable {
        uint256 betAmount = msg.value;
        if (betAmount == 0) {
            revert WrongBet();
        }

        uint256 contractBalance = address(this).balance;
        if (contractBalance < (betAmount * maxMultiplier) / BASE) {
            revert NoBalance();
        }

        uint256 spinnerResult = _calculateSpinnerResult();
        uint256 multiplier = payoutMultipliers[spinnerResult];
        uint256 payout = (betAmount * multiplier) / BASE;
        uint256 actualMultiplier = multiplier;

        if (multiplier > 0) {
            uint256 devFee = (betAmount * devFeeBasisPoints) / BASE;
            uint256 playerPayout = payout - devFee;
            actualMultiplier = (playerPayout * BASE) / betAmount;
            lastWinnngNonce = nonce - 1;
            payable(owner).transfer(devFee);
            payable(msg.sender).transfer(playerPayout);
        }

        emit SpinResult(
            msg.sender,
            _mapResultToCombination(spinnerResult),
            payout,
            actualMultiplier,
            address(this).balance
        );
    }

    function _calculateSpinnerResult() private returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(seed, nonce))) %
            TOTAL_COMBINATIONS;
        nonce++;
        return random;
    }

    function _mapResultToCombination(
        uint256 number
    ) private pure returns (uint256[REELS] memory) {
        uint256[REELS] memory combination;
        for (uint i = 0; i < REELS; i++) {
            combination[i] = number % SYMBOLS;
            number /= SYMBOLS;
        }
        return combination;
    }

    function _mapCombinationToResult(
        uint256[REELS] memory spinners
    ) private pure returns (uint256) {
        uint256 result = 0;
        for (uint i = 0; i < spinners.length; i++) {
            result += spinners[i] * (SYMBOLS ** i);
        }
        return result;
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    //Owner fees and initial liquidity managment
    function setMultipliers(
        uint256[REELS][] memory combinations,
        uint256[] memory multipliersInBasisPoints
    ) external onlyOwner {
        if (fixedMultipliers) {
            revert FixedMultipliers();
        }

        if (combinations.length != multipliersInBasisPoints.length) {
            revert InvalidMultiplier();
        }
        for (uint256 i = 0; i < combinations.length; i++) {
            if (multipliersInBasisPoints[i] < 2 * devFeeBasisPoints) {
                revert InvalidMultiplier();
            }

            uint256 combinationResult = _mapCombinationToResult(
                combinations[i]
            );
            uint256 currentMultiplier = payoutMultipliers[combinationResult];
            if (currentMultiplier > 0) {
                totalActiveMultipliers -= currentMultiplier;
                totalActiveCombinations--;
            }
            if (multipliersInBasisPoints[i] > maxMultiplier) {
                maxMultiplier = multipliersInBasisPoints[i];
            }
            payoutMultipliers[combinationResult] = multipliersInBasisPoints[i];
            totalActiveMultipliers += multipliersInBasisPoints[i];
            totalActiveCombinations++;
        }
    }

    function overwriteMaxMultiplier(
        uint256 newMaxMultiplier
    ) external onlyOwner {
        maxMultiplier = newMaxMultiplier;
    }

    function fixMultipliers() external onlyOwner {
        fixedMultipliers = true;
    }

    function lowerDevFee(uint256 newFeeBasisPoints) external onlyOwner {
        if (newFeeBasisPoints >= devFeeBasisPoints) {
            revert HigherFee();
        }
        devFeeBasisPoints = newFeeBasisPoints;
    }

    function provideDevLiquidity() external payable onlyOwner {
        devLiquidity += msg.value;
    }

    function recoverDevLiquidity() external onlyOwner {
        uint256 amountToRecover = devLiquidity;
        devLiquidity = 0;
        payable(owner).transfer(amountToRecover);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }
}
