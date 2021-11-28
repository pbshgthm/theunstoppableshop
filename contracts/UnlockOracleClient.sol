// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

interface IGuild {
    function completeUnlock(
        uint256 _requestId,
        bytes32[2] memory _unlockedLicense
    ) external;
}

contract UnlockOracleClient is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    struct Job {
        uint256 requestId;
        address guild;
        uint256 index; // 0 or 1
        bytes32 pairJobId;
        bytes32 result;
    }
    mapping(bytes32 => Job) jobs;

    address owner;
    uint256 public requestsCount = 0;
    mapping(address => bool) memberGuild;

    address oracle = 0x0bDDCD124709aCBf9BB3F824EbC61C87019888bb;
    bytes32 jobId = "c6a006e4f4844754a6524445acde84a0";
    uint256 fee = 0.01 * 10**18;
    address linkTokenContract = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;
    string urlString1 =
        "https://theunstoppabledev.vercel.app/api/byte32?sourceEncryptedText=";

    string urlString2 = "&targetPublicKey=";

    function setConstants(
        address _oracle,
        bytes32 _jobId,
        uint256 _fee,
        address _linkTokenContract
    ) external {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        linkTokenContract = _linkTokenContract;
    }

    function setUrl(string memory _urlString1, string memory _urlString2)
        external
    {
        urlString1 = _urlString1;
        urlString2 = _urlString2;
    }

    function requestCount() external view returns (uint256) {
        return requestsCount;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyMember() {
        require(memberGuild[msg.sender]);
        _;
    }

    constructor() {
        setChainlinkToken(linkTokenContract);
        owner = msg.sender;
    }

    function addMember(address _guild) public onlyOwner {
        memberGuild[_guild] = true;
    }

    function removeMember(address _guild) public onlyOwner {
        delete memberGuild[_guild];
    }

    function createUrl(string memory _lockedLicense, string memory _publicKey)
        internal
        pure
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "https://theunstoppabledev.vercel.app/api/byte32?sourceEncryptedText=",
                    _lockedLicense,
                    "&targetPublicKey=",
                    _publicKey
                )
            );
    } // change the url

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
        request0.add("path", "p1");

        Chainlink.Request memory request1 = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        request1.add("get", url);
        request1.add("path", "p2");

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
        public
        recordChainlinkFulfillment(_jobId)
    {
        if (jobs[jobs[_jobId].pairJobId].result != bytes32(0)) {
            bytes32[2] memory result;
            result[jobs[_jobId].index] = _data;
            result[jobs[jobs[_jobId].pairJobId].index] = jobs[
                jobs[_jobId].pairJobId
            ].result;
            IGuild(jobs[_jobId].guild).completeUnlock(
                jobs[_jobId].requestId,
                result
            );
        } else {
            jobs[_jobId].result = _data;
        }
    }
}
