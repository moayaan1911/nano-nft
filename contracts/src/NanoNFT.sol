// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NanoNFT by Ayaan (NNFT)
 * @dev ERC721 NFT contract with AI-powered generation and user limit system
 * @notice Collection of AI-generated NFTs with gasless minting on Sepolia
 */
contract NanoNFT is ERC721, ERC721URIStorage, Ownable {
    // Constants from project requirements
    uint256 public constant MAX_FREE_CREATIONS_PER_DAY = 3;
    uint256 public constant CREATION_COOLDOWN = 24 hours;
    uint256 public constant MAX_SUPPLY = 10000; // Maximum NFTs that can be minted

    // Token tracking
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    // User creation tracking (for free creations limit)
    mapping(address => uint256) public userCreationCount;
    mapping(address => uint256) public lastCreationTime;
    mapping(address => uint256) public userFreeCreationsToday;

    // Global statistics
    uint256 public totalCreations;
    uint256 public totalFreeCreations;

    // Events for UI integration
    event NFTCreated(address indexed creator, uint256 indexed tokenId, string tokenURI, bool isFree, uint256 timestamp);
    event CreationLimitExceeded(address indexed user, uint256 timestamp);
    event BaseURIUpdated(string newBaseURI);

    // Custom errors for better gas efficiency
    error NanoNFT__MaxSupplyExceeded();
    error NanoNFT__CreationLimitExceeded();
    error NanoNFT__CooldownActive();
    error NanoNFT__ZeroAddress();
    error NanoNFT__InvalidTokenId();
    error NanoNFT__NotTokenOwner();
    error NanoNFT__EmptyTokenURI();

    constructor() ERC721("NanoNFT by Ayaan", "NNFT") Ownable(msg.sender) {
        _nextTokenId = 1; // Start token IDs from 1
        _baseTokenURI = "";
    }

    /**
     * @dev Create a new NFT (main minting function)
     * @notice Users can create up to 3 free NFTs per 24 hours
     * @param _tokenURI The metadata URI for the NFT
     * @param isFree Whether this is a free creation or paid
     */
    function createNFT(string memory _tokenURI, bool isFree) external returns (uint256) {
        if (msg.sender == address(0)) revert NanoNFT__ZeroAddress();
        if (bytes(_tokenURI).length == 0) revert NanoNFT__EmptyTokenURI();
        if (_nextTokenId > MAX_SUPPLY) revert NanoNFT__MaxSupplyExceeded();

        // Check free creation limits if this is a free creation
        if (isFree) {
            _checkFreeCreationEligibility(msg.sender);
        }

        // Mint the NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Update statistics
        totalCreations++;
        if (isFree) {
            totalFreeCreations++;
            userFreeCreationsToday[msg.sender]++;
        }

        // Update user tracking
        userCreationCount[msg.sender]++;
        lastCreationTime[msg.sender] = block.timestamp;

        emit NFTCreated(msg.sender, tokenId, _tokenURI, isFree, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Check if user can create a free NFT (UI helper function)
     * @param user Address to check
     * @return canCreate Whether user can create free NFT
     * @return creationsToday Current free creations today
     * @return timeLeft Seconds remaining in cooldown (0 if can create)
     */
    function canCreateFreeNFT(address user) external view returns (bool canCreate, uint256 creationsToday, uint256 timeLeft) {
        creationsToday = userFreeCreationsToday[user];

        // If under daily limit, can create
        if (creationsToday < MAX_FREE_CREATIONS_PER_DAY) {
            return (true, creationsToday, 0);
        }

        // Check if cooldown period has passed (new day started)
        if (lastCreationTime[user] != 0 && lastCreationTime[user] + CREATION_COOLDOWN <= block.timestamp) {
            return (true, 0, 0); // New day, can create again
        } else {
            // Still in cooldown period
            uint256 cooldownEnd = lastCreationTime[user] + CREATION_COOLDOWN;
            return (false, creationsToday, cooldownEnd - block.timestamp);
        }
    }

    /**
     * @dev Get user's creation statistics (UI display function)
     * @param user Address to check
     * @return _totalCreations Total NFTs created by user
     * @return _freeCreationsToday Free creations used today
     * @return _lastCreation Timestamp of last creation
     * @return _nextFreeCreation Timestamp when user can create next free NFT
     */
    function getUserCreationStats(address user)
        external
        view
        returns (uint256 _totalCreations, uint256 _freeCreationsToday, uint256 _lastCreation, uint256 _nextFreeCreation)
    {
        _totalCreations = userCreationCount[user];
        _freeCreationsToday = userFreeCreationsToday[user];
        _lastCreation = lastCreationTime[user];

        if (_lastCreation == 0) {
            _nextFreeCreation = block.timestamp; // Can create immediately if never created
        } else {
            _nextFreeCreation = _lastCreation + CREATION_COOLDOWN;
        }
    }

    /**
     * @dev Get global creation statistics (UI analytics)
     * @return total Total NFTs created
     * @return free Total free NFTs created
     * @return paid Total paid NFTs created
     * @return maxSupply Maximum possible NFTs
     */
    function getGlobalStats() external view returns (uint256 total, uint256 free, uint256 paid, uint256 maxSupply) {
        total = totalCreations;
        free = totalFreeCreations;
        paid = totalCreations - totalFreeCreations;
        maxSupply = MAX_SUPPLY;
    }

    /**
     * @dev Internal function to check free creation eligibility
     * @param user Address to check
     */
    function _checkFreeCreationEligibility(address user) internal {
        uint256 creationsToday = userFreeCreationsToday[user];

        // If user has reached daily limit
        if (creationsToday >= MAX_FREE_CREATIONS_PER_DAY) {
            // Check if cooldown period has passed
            if (lastCreationTime[user] != 0 && lastCreationTime[user] + CREATION_COOLDOWN > block.timestamp) {
                emit CreationLimitExceeded(user, block.timestamp);
                revert NanoNFT__CreationLimitExceeded();
            } else {
                // Reset daily counter for new day
                userFreeCreationsToday[user] = 0;
            }
        }
    }

    /**
     * @dev Update base URI for metadata (owner only)
     * @param newBaseURI New base URI for token metadata
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Emergency mint function for owner (bypass limits)
     * @param to Address to mint NFT to
     * @param _tokenURI Metadata URI for the NFT
     */
    function emergencyMint(address to, string memory _tokenURI) external onlyOwner returns (uint256) {
        if (to == address(0)) revert NanoNFT__ZeroAddress();
        if (bytes(_tokenURI).length == 0) revert NanoNFT__EmptyTokenURI();
        if (_nextTokenId > MAX_SUPPLY) revert NanoNFT__MaxSupplyExceeded();

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        totalCreations++;

        emit NFTCreated(to, tokenId, _tokenURI, false, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Burn an NFT (reduce supply)
     * @param tokenId ID of the NFT to burn
     */
    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NanoNFT__NotTokenOwner();
        _burn(tokenId);
    }

    /**
     * @dev Get token URI for a specific token
     * @param tokenId ID of the token
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Get base URI for metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get next token ID that will be minted
     */
    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Check if token exists
     * @param tokenId ID of the token to check
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }


    /**
     * @dev Override supportsInterface for ERC721URIStorage
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
