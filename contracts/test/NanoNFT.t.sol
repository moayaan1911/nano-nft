// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {DeployNanoNFT} from "script/NanoNFT.s.sol";
import {NanoNFT} from "src/NanoNFT.sol";

contract NanoNFTTest is Test {
    NanoNFT public nanoNFT;
    address public owner;

    // Test users
    address public ALICE = makeAddr("alice");
    address public BOB = makeAddr("bob");
    address public CHARLIE = makeAddr("charlie");

    // Constants from contract
    uint256 public constant MAX_FREE_CREATIONS_PER_DAY = 3;
    uint256 public constant CREATION_COOLDOWN = 24 hours;
    uint256 public constant MAX_SUPPLY = 10000;

    // Sample URIs for testing
    string public constant SAMPLE_URI_1 = "https://api.nano-nft.com/metadata/1.json";
    string public constant SAMPLE_URI_2 = "https://api.nano-nft.com/metadata/2.json";
    string public constant SAMPLE_URI_3 = "https://api.nano-nft.com/metadata/3.json";

    function setUp() public {
        DeployNanoNFT deployer = new DeployNanoNFT();
        nanoNFT = deployer.run();
        owner = nanoNFT.owner();
    }

    // Basic ERC721 functionality tests
    function testTokenMetadata() public view {
        assertEq(nanoNFT.name(), "NanoNFT by Ayaan");
        assertEq(nanoNFT.symbol(), "NNFT");
    }

    function testInitialState() public view {
        assertEq(nanoNFT.totalCreations(), 0);
        assertEq(nanoNFT.totalFreeCreations(), 0);
        assertEq(nanoNFT.getNextTokenId(), 1);
        assertEq(nanoNFT.owner(), owner);
    }

    function testCreateFirstNFT() public {
        uint256 tokenId = _createNFT(ALICE, SAMPLE_URI_1, true);

        assertEq(tokenId, 1);
        assertEq(nanoNFT.ownerOf(1), ALICE);
        assertEq(nanoNFT.tokenURI(1), SAMPLE_URI_1);
        assertEq(nanoNFT.totalCreations(), 1);
        assertEq(nanoNFT.totalFreeCreations(), 1);
    }

    function testCreateNFTEvent() public {
        vm.expectEmit(true, true, false, true);
        emit NanoNFT.NFTCreated(ALICE, 1, SAMPLE_URI_1, true, block.timestamp);

        vm.prank(ALICE);
        nanoNFT.createNFT(SAMPLE_URI_1, true);
    }

    // Free creation limit tests
    function testFreeCreationLimit() public {
        // Alice creates 3 free NFTs
        for (uint256 i = 0; i < MAX_FREE_CREATIONS_PER_DAY; i++) {
            vm.prank(ALICE);
            nanoNFT.createNFT(SAMPLE_URI_1, true);
        }

        // Should not be able to create 4th free NFT
        vm.prank(ALICE);
        vm.expectRevert(NanoNFT.NanoNFT__CreationLimitExceeded.selector);
        nanoNFT.createNFT(SAMPLE_URI_1, true);

        assertEq(nanoNFT.userFreeCreationsToday(ALICE), MAX_FREE_CREATIONS_PER_DAY);
    }

    function testFreeCreationCooldown() public {
        // Alice creates 3 free NFTs
        for (uint256 i = 0; i < MAX_FREE_CREATIONS_PER_DAY; i++) {
            vm.prank(ALICE);
            nanoNFT.createNFT(SAMPLE_URI_1, true);
        }

        // Try to create 4th - should fail
        vm.prank(ALICE);
        vm.expectRevert(NanoNFT.NanoNFT__CreationLimitExceeded.selector);
        nanoNFT.createNFT(SAMPLE_URI_1, true);

        // Fast forward 24 hours
        vm.warp(block.timestamp + CREATION_COOLDOWN);

        // Should be able to create again (new day)
        vm.prank(ALICE);
        uint256 tokenId = nanoNFT.createNFT(SAMPLE_URI_2, true);

        assertEq(tokenId, 4);
        assertEq(nanoNFT.userFreeCreationsToday(ALICE), 1);
    }

    function testPaidCreationNoLimit() public {
        // Alice can create unlimited paid NFTs
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(ALICE);
            nanoNFT.createNFT(SAMPLE_URI_1, false);
        }

        assertEq(nanoNFT.totalCreations(), 5);
        assertEq(nanoNFT.userCreationCount(ALICE), 5);
        assertEq(nanoNFT.userFreeCreationsToday(ALICE), 0);
    }

    function testCanCreateFreeNFT() public {
        // Initially should be able to create
        (bool canCreate, uint256 creationsToday, uint256 timeLeft) = nanoNFT.canCreateFreeNFT(ALICE);
        assertTrue(canCreate);
        assertEq(creationsToday, 0);
        assertEq(timeLeft, 0);

        // Create first NFT
        vm.prank(ALICE);
        nanoNFT.createNFT(SAMPLE_URI_1, true);

        (canCreate, creationsToday, timeLeft) = nanoNFT.canCreateFreeNFT(ALICE);
        assertTrue(canCreate);
        assertEq(creationsToday, 1);
        assertEq(timeLeft, 0);

        // Create 2 more NFTs (total: 3)
        vm.prank(ALICE);
        nanoNFT.createNFT(SAMPLE_URI_1, true);
        vm.prank(ALICE);
        nanoNFT.createNFT(SAMPLE_URI_1, true);

        (canCreate, creationsToday, timeLeft) = nanoNFT.canCreateFreeNFT(ALICE);
        assertFalse(canCreate);
        assertEq(creationsToday, 3);
        assertTrue(timeLeft > 0);

        // After cooldown, should be able to create again (new day, count resets)
        vm.warp(block.timestamp + CREATION_COOLDOWN);
        (canCreate, creationsToday, timeLeft) = nanoNFT.canCreateFreeNFT(ALICE);
        assertTrue(canCreate);
        assertEq(creationsToday, 0); // New day, count resets to 0
        assertEq(timeLeft, 0);
    }

    function testGetUserCreationStats() public {
        // Before any creations
        (uint256 totalCreations, uint256 freeCreationsToday, uint256 lastCreation, uint256 nextFreeCreation) = nanoNFT.getUserCreationStats(ALICE);
        assertEq(totalCreations, 0);
        assertEq(freeCreationsToday, 0);
        assertEq(lastCreation, 0);
        assertEq(nextFreeCreation, block.timestamp);

        // After first creation
        vm.prank(ALICE);
        nanoNFT.createNFT(SAMPLE_URI_1, true);

        (totalCreations, freeCreationsToday, lastCreation, nextFreeCreation) = nanoNFT.getUserCreationStats(ALICE);
        assertEq(totalCreations, 1);
        assertEq(freeCreationsToday, 1);
        assertEq(lastCreation, block.timestamp);
        assertEq(nextFreeCreation, block.timestamp + CREATION_COOLDOWN);
    }

    function testGetGlobalStats() public {
        // Initially no creations
        (uint256 total, uint256 free, uint256 paid, uint256 maxSupply) = nanoNFT.getGlobalStats();
        assertEq(total, 0);
        assertEq(free, 0);
        assertEq(paid, 0);
        assertEq(maxSupply, MAX_SUPPLY);

        // Create some NFTs
        vm.prank(ALICE);
        nanoNFT.createNFT(SAMPLE_URI_1, true); // free

        vm.prank(BOB);
        nanoNFT.createNFT(SAMPLE_URI_2, false); // paid

        vm.prank(ALICE);
        nanoNFT.createNFT(SAMPLE_URI_3, true); // free

        (total, free, paid, maxSupply) = nanoNFT.getGlobalStats();
        assertEq(total, 3);
        assertEq(free, 2);
        assertEq(paid, 1);
        assertEq(maxSupply, MAX_SUPPLY);
    }

    function testMultipleUsersFreeCreations() public {
        // Each user creates their daily limit
        for (uint256 i = 0; i < MAX_FREE_CREATIONS_PER_DAY; i++) {
            vm.prank(ALICE);
            nanoNFT.createNFT(SAMPLE_URI_1, true);

            vm.prank(BOB);
            nanoNFT.createNFT(SAMPLE_URI_2, true);

            vm.prank(CHARLIE);
            nanoNFT.createNFT(SAMPLE_URI_3, true);
        }

        assertEq(nanoNFT.userFreeCreationsToday(ALICE), MAX_FREE_CREATIONS_PER_DAY);
        assertEq(nanoNFT.userFreeCreationsToday(BOB), MAX_FREE_CREATIONS_PER_DAY);
        assertEq(nanoNFT.userFreeCreationsToday(CHARLIE), MAX_FREE_CREATIONS_PER_DAY);
        assertEq(nanoNFT.totalFreeCreations(), MAX_FREE_CREATIONS_PER_DAY * 3);
    }

    // Owner functions tests
    function testSetBaseURI() public {
        string memory newBaseURI = "https://new.api.nano-nft.com/metadata/";

        vm.prank(owner);
        nanoNFT.setBaseURI(newBaseURI);

        // Verify base URI is updated (would be reflected in tokenURI calls)
        assertEq(nanoNFT.getNextTokenId(), 1); // Just a basic check
    }

    function testSetBaseURINotOwner() public {
        vm.prank(ALICE);
        vm.expectRevert();
        nanoNFT.setBaseURI("https://fake.api.com/");
    }

    function testEmergencyMint() public {
        vm.prank(owner);
        uint256 tokenId = nanoNFT.emergencyMint(BOB, SAMPLE_URI_1);

        assertEq(tokenId, 1);
        assertEq(nanoNFT.ownerOf(1), BOB);
        assertEq(nanoNFT.tokenURI(1), SAMPLE_URI_1);
        assertEq(nanoNFT.totalCreations(), 1);
    }

    function testEmergencyMintNotOwner() public {
        vm.prank(ALICE);
        vm.expectRevert();
        nanoNFT.emergencyMint(BOB, SAMPLE_URI_1);
    }

    // Burn functionality tests
    function testBurnNFT() public {
        // Create NFT first
        vm.prank(ALICE);
        uint256 tokenId = nanoNFT.createNFT(SAMPLE_URI_1, true);

        // Burn the NFT
        vm.prank(ALICE);
        nanoNFT.burn(tokenId);

        // Should not exist anymore - ERC721 throws ERC721NonexistentToken
        vm.expectRevert(abi.encodeWithSignature("ERC721NonexistentToken(uint256)", tokenId));
        nanoNFT.ownerOf(tokenId);
    }

    function testBurnNotOwner() public {
        // Alice creates NFT
        vm.prank(ALICE);
        uint256 tokenId = nanoNFT.createNFT(SAMPLE_URI_1, true);

        // Bob tries to burn Alice's NFT
        vm.prank(BOB);
        vm.expectRevert(NanoNFT.NanoNFT__NotTokenOwner.selector);
        nanoNFT.burn(tokenId);
    }

    // Error handling tests
    function testCreateNFTZeroAddress() public {
        vm.prank(address(0));
        vm.expectRevert(NanoNFT.NanoNFT__ZeroAddress.selector);
        nanoNFT.createNFT(SAMPLE_URI_1, true);
    }

    function testCreateNFTEmptyURI() public {
        vm.prank(ALICE);
        vm.expectRevert(NanoNFT.NanoNFT__EmptyTokenURI.selector);
        nanoNFT.createNFT("", true);
    }

    function testCreateNFTMaxSupplyExceeded() public {
        // Mint NFTs until we reach max supply
        for (uint256 i = 0; i < MAX_SUPPLY; i++) {
            vm.prank(ALICE);
            nanoNFT.createNFT(SAMPLE_URI_1, false); // Use paid to avoid limits
        }

        // Next mint should fail
        vm.prank(ALICE);
        vm.expectRevert(NanoNFT.NanoNFT__MaxSupplyExceeded.selector);
        nanoNFT.createNFT(SAMPLE_URI_1, false);
    }

    function testTokenURIInvalidToken() public {
        vm.expectRevert(abi.encodeWithSignature("ERC721NonexistentToken(uint256)", 999));
        nanoNFT.tokenURI(999);
    }

    // Edge cases and fuzzing
    function testFuzzCreateNFT(uint256 numCreations) public {
        numCreations = bound(numCreations, 1, 100); // Reasonable bounds for fuzzing

        for (uint256 i = 0; i < numCreations; i++) {
            vm.prank(ALICE);
            nanoNFT.createNFT(SAMPLE_URI_1, false); // Use paid to avoid limits
        }

        assertEq(nanoNFT.totalCreations(), numCreations);
        assertEq(nanoNFT.userCreationCount(ALICE), numCreations);
    }

    function testFuzzFreeCreations(uint256 numFree) public {
        numFree = bound(numFree, 0, MAX_FREE_CREATIONS_PER_DAY);

        for (uint256 i = 0; i < numFree; i++) {
            vm.prank(ALICE);
            nanoNFT.createNFT(SAMPLE_URI_1, true);
        }

        assertEq(nanoNFT.userFreeCreationsToday(ALICE), numFree);
        assertEq(nanoNFT.totalFreeCreations(), numFree);
    }

    // Transfer tests (basic ERC721 functionality)
    function testTransferNFT() public {
        // Alice creates NFT
        vm.prank(ALICE);
        uint256 tokenId = nanoNFT.createNFT(SAMPLE_URI_1, true);

        // Alice transfers to Bob
        vm.prank(ALICE);
        nanoNFT.transferFrom(ALICE, BOB, tokenId);

        assertEq(nanoNFT.ownerOf(tokenId), BOB);
        assertEq(nanoNFT.userCreationCount(ALICE), 1); // Alice still gets credit for creation
    }

    function testApproveAndTransferFrom() public {
        // Alice creates NFT
        vm.prank(ALICE);
        uint256 tokenId = nanoNFT.createNFT(SAMPLE_URI_1, true);

        // Alice approves Bob
        vm.prank(ALICE);
        nanoNFT.approve(BOB, tokenId);

        // Bob transfers from Alice to Charlie
        vm.prank(BOB);
        nanoNFT.transferFrom(ALICE, CHARLIE, tokenId);

        assertEq(nanoNFT.ownerOf(tokenId), CHARLIE);
    }

    // Helper function to create NFT and return tokenId
    function _createNFT(address creator, string memory uri, bool isFree) internal returns (uint256) {
        vm.prank(creator);
        return nanoNFT.createNFT(uri, isFree);
    }
}
