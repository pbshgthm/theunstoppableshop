// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

interface IGuild {
    function completeUnlock(uint256 _requestId, string memory _unlockedLicense)
        external;
}

contract UnlockOracleClient is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    string public l;
    string public ll;
    string public x1;
    string public x2;

    struct Job {
        uint256 requestId;
        address guild;
        uint256 index; // 0 or 1
        bytes32 pairJobId;
        bytes32 result;
    }
    mapping(bytes32 => Job) public jobs;

    address owner;
    uint256 public requestsCount = 0;
    mapping(address => bool) memberGuild;

    // original unlock oracle
    address oracle = 0x0bDDCD124709aCBf9BB3F824EbC61C87019888bb;
    bytes32 jobId = "c6a006e4f4844754a6524445acde84a0";

    // address oracle = 0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8;
    // bytes32 jobId = "d5270d1c311941d0b08bead21fea7747";
    uint256 fee = 0.01 * 10**18;
    address linkTokenContract = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;

    string baseUrl = "https://re-encrypt.now.sh/api/re-encrypt";
    string[2] encryptionParams = [
        '{"version":"x25519-xsalsa20-poly1305","nonce":"f+FQPeKzNJrWEehvJKAQ5uY+hpMBaYQ4","ephemPublicKey":"fmQWzhihX0xHvJvhd5wGFClqypNX6VTvCaHcvEYshXA=","ciphertext":"',
        '"}'
    ];

    string apiPublicKey = "N8Dux/ah3ee2dLjKUAHDQOJE5cXAC/WflFUF0UfUmGQ=";

    function setConstants(
        address _oracle,
        bytes32 _jobId,
        uint256 _fee,
        address _linkTokenContract,
        string memory _apiPublicKey
    ) external {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        linkTokenContract = _linkTokenContract;
        apiPublicKey = _apiPublicKey;
    }

    function setUrl(string memory _baseUrl) external {
        baseUrl = _baseUrl;
    }

    function requestCount() external view returns (uint256) {
        return requestsCount;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyMember() {
        //require(memberGuild[msg.sender],"Only member can call this function");
        _;
    }

    constructor() {
        setChainlinkToken(linkTokenContract);
        owner = msg.sender;
    }

    function addMember(address _guild) external onlyOwner {
        memberGuild[_guild] = true;
    }

    function removeMember(address _guild) external onlyOwner {
        delete memberGuild[_guild];
    }

    function getApiPublicKey() external view returns (string memory) {
        return apiPublicKey;
    }

    function createUrl(string memory _lockedLicense, string memory _publicKey)
        internal
        view
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    baseUrl,
                    "?encryptedText=",
                    _lockedLicense,
                    "&publicKey=",
                    _publicKey
                )
            );
    }

    function addRequest(string memory _lockedLicense, string memory _publicKey)
        external
        onlyMember
    {
        string memory url = createUrl(_lockedLicense, _publicKey);
        Chainlink.Request memory request0 = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        request0.add("get", url);
        request0.add("path", "reEncrypted_0");

        Chainlink.Request memory request1 = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        request1.add("get", url);
        request1.add("path", "reEncrypted_1");

        bytes32 jobId0 = sendChainlinkRequestTo(oracle, request0, fee);
        bytes32 jobId1 = sendChainlinkRequestTo(oracle, request1, fee);

        jobs[jobId0] = Job({
            requestId: requestsCount,
            guild: msg.sender,
            index: 0,
            pairJobId: jobId1,
            result: bytes32(0)
        });

        jobs[jobId1] = Job({
            requestId: requestsCount,
            guild: msg.sender,
            index: 1,
            pairJobId: jobId0,
            result: bytes32(0)
        });

        requestsCount++;
    }

    function fulfill(bytes32 _jobId, bytes32 _data)
        external
        recordChainlinkFulfillment(_jobId)
    {
        if (jobs[jobs[_jobId].pairJobId].result != bytes32(0)) {
            bytes32[2] memory result;

            result[jobs[_jobId].index] = _data;
            result[jobs[jobs[_jobId].pairJobId].index] = jobs[
                jobs[_jobId].pairJobId
            ].result;

            string memory license = string(abi.encodePacked(result));
            IGuild(jobs[_jobId].guild).completeUnlock(
                jobs[_jobId].requestId,
                string(
                    abi.encodePacked(
                        encryptionParams[0],
                        license,
                        encryptionParams[1]
                    )
                )
            );
        } else {
            jobs[_jobId].result = _data;
        }
    }
}
