/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type { ERC721, ERC721Interface } from '../ERC721';

const _abi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'approved',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'getApproved',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
    ],
    name: 'isApprovedForAll',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'tokenURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const _bytecode =
  '0x60806040523480156200001157600080fd5b506040518060400160405280600b81526020017f43727970746f50756e6b730000000000000000000000000000000000000000008152506040518060400160405280600581526020017f50554e4b53000000000000000000000000000000000000000000000000000000815250816000908051906020019062000096929190620000b8565b508060019080519060200190620000af929190620000b8565b505050620001cd565b828054620000c69062000168565b90600052602060002090601f016020900481019282620000ea576000855562000136565b82601f106200010557805160ff191683800117855562000136565b8280016001018555821562000136579182015b828111156200013557825182559160200191906001019062000118565b5b50905062000145919062000149565b5090565b5b80821115620001645760008160009055506001016200014a565b5090565b600060028204905060018216806200018157607f821691505b602082108114156200019857620001976200019e565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6126fb80620001dd6000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80636352211e1161008c578063a22cb46511610066578063a22cb46514610249578063b88d4fde14610265578063c87b56dd14610281578063e985e9c5146102b1576100ea565b80636352211e146101cb57806370a08231146101fb57806395d89b411461022b576100ea565b8063095ea7b3116100c8578063095ea7b31461016d5780631249c58b1461018957806323b872dd1461019357806342842e0e146101af576100ea565b806301ffc9a7146100ef57806306fdde031461011f578063081812fc1461013d575b600080fd5b610109600480360381019061010491906118fd565b6102e1565b6040516101169190611cbd565b60405180910390f35b6101276103c3565b6040516101349190611cd8565b60405180910390f35b6101576004803603810190610152919061194f565b610455565b6040516101649190611c56565b60405180910390f35b610187600480360381019061018291906118c1565b6104da565b005b6101916105f2565b005b6101ad60048036038101906101a891906117bb565b610622565b005b6101c960048036038101906101c491906117bb565b610682565b005b6101e560048036038101906101e0919061194f565b6106a2565b6040516101f29190611c56565b60405180910390f35b61021560048036038101906102109190611756565b610754565b6040516102229190611eba565b60405180910390f35b61023361080c565b6040516102409190611cd8565b60405180910390f35b610263600480360381019061025e9190611885565b61089e565b005b61027f600480360381019061027a919061180a565b610a1f565b005b61029b6004803603810190610296919061194f565b610a81565b6040516102a89190611cd8565b60405180910390f35b6102cb60048036038101906102c6919061177f565b610b28565b6040516102d89190611cbd565b60405180910390f35b60007f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806103ac57507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b806103bc57506103bb82610bbc565b5b9050919050565b6060600080546103d2906120df565b80601f01602080910402602001604051908101604052809291908181526020018280546103fe906120df565b801561044b5780601f106104205761010080835404028352916020019161044b565b820191906000526020600020905b81548152906001019060200180831161042e57829003601f168201915b5050505050905090565b600061046082610c26565b61049f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161049690611e1a565b60405180910390fd5b6004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b60006104e5826106a2565b90508073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610556576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161054d90611e7a565b60405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16610575610c92565b73ffffffffffffffffffffffffffffffffffffffff1614806105a457506105a38161059e610c92565b610b28565b5b6105e3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105da90611d9a565b60405180910390fd5b6105ed8383610c9a565b505050565b6106203360066000815461060590612142565b91905081905560405180602001604052806000815250610d53565b565b61063361062d610c92565b82610dae565b610672576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161066990611e9a565b60405180910390fd5b61067d838383610e8c565b505050565b61069d83838360405180602001604052806000815250610a1f565b505050565b6000806002600084815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561074b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161074290611dda565b60405180910390fd5b80915050919050565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156107c5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107bc90611dba565b60405180910390fd5b600360008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606001805461081b906120df565b80601f0160208091040260200160405190810160405280929190818152602001828054610847906120df565b80156108945780601f1061086957610100808354040283529160200191610894565b820191906000526020600020905b81548152906001019060200180831161087757829003601f168201915b5050505050905090565b6108a6610c92565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610914576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161090b90611d5a565b60405180910390fd5b8060056000610921610c92565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff166109ce610c92565b73ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3183604051610a139190611cbd565b60405180910390a35050565b610a30610a2a610c92565b83610dae565b610a6f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a6690611e9a565b60405180910390fd5b610a7b848484846110e8565b50505050565b6060610a8c82610c26565b610acb576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ac290611e5a565b60405180910390fd5b6000610ad5611144565b90506000815111610af55760405180602001604052806000815250610b20565b80610aff8461115b565b604051602001610b10929190611c32565b6040516020818303038152906040525b915050919050565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b60008073ffffffffffffffffffffffffffffffffffffffff166002600084815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614159050919050565b600033905090565b816004600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff16610d0d836106a2565b73ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b610d5d8383611308565b610d6a60008484846114d6565b610da9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610da090611cfa565b60405180910390fd5b505050565b6000610db982610c26565b610df8576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610def90611d7a565b60405180910390fd5b6000610e03836106a2565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480610e7257508373ffffffffffffffffffffffffffffffffffffffff16610e5a84610455565b73ffffffffffffffffffffffffffffffffffffffff16145b80610e835750610e828185610b28565b5b91505092915050565b8273ffffffffffffffffffffffffffffffffffffffff16610eac826106a2565b73ffffffffffffffffffffffffffffffffffffffff1614610f02576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ef990611e3a565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610f72576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f6990611d3a565b60405180910390fd5b610f7d83838361166d565b610f88600082610c9a565b6001600360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610fd89190611ff5565b925050819055506001600360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461102f9190611f6e565b92505081905550816002600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b6110f3848484610e8c565b6110ff848484846114d6565b61113e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161113590611cfa565b60405180910390fd5b50505050565b606060405180602001604052806000815250905090565b606060008214156111a3576040518060400160405280600181526020017f30000000000000000000000000000000000000000000000000000000000000008152509050611303565b600082905060005b600082146111d55780806111be90612142565b915050600a826111ce9190611fc4565b91506111ab565b60008167ffffffffffffffff811115611217577f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6040519080825280601f01601f1916602001820160405280156112495781602001600182028036833780820191505090505b5090505b600085146112fc576001826112629190611ff5565b9150600a85611271919061218b565b603061127d9190611f6e565b60f81b8183815181106112b9577f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600a856112f59190611fc4565b945061124d565b8093505050505b919050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611378576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161136f90611dfa565b60405180910390fd5b61138181610c26565b156113c1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016113b890611d1a565b60405180910390fd5b6113cd6000838361166d565b6001600360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461141d9190611f6e565b92505081905550816002600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a45050565b60006114f78473ffffffffffffffffffffffffffffffffffffffff16611672565b15611660578373ffffffffffffffffffffffffffffffffffffffff1663150b7a02611520610c92565b8786866040518563ffffffff1660e01b81526004016115429493929190611c71565b602060405180830381600087803b15801561155c57600080fd5b505af192505050801561158d57506040513d601f19601f8201168201806040525081019061158a9190611926565b60015b611610573d80600081146115bd576040519150601f19603f3d011682016040523d82523d6000602084013e6115c2565b606091505b50600081511415611608576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016115ff90611cfa565b60405180910390fd5b805181602001fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614915050611665565b600190505b949350505050565b505050565b600080823b905060008111915050919050565b600061169861169384611efa565b611ed5565b9050828152602081018484840111156116b057600080fd5b6116bb84828561209d565b509392505050565b6000813590506116d281612669565b92915050565b6000813590506116e781612680565b92915050565b6000813590506116fc81612697565b92915050565b60008151905061171181612697565b92915050565b600082601f83011261172857600080fd5b8135611738848260208601611685565b91505092915050565b600081359050611750816126ae565b92915050565b60006020828403121561176857600080fd5b6000611776848285016116c3565b91505092915050565b6000806040838503121561179257600080fd5b60006117a0858286016116c3565b92505060206117b1858286016116c3565b9150509250929050565b6000806000606084860312156117d057600080fd5b60006117de868287016116c3565b93505060206117ef868287016116c3565b925050604061180086828701611741565b9150509250925092565b6000806000806080858703121561182057600080fd5b600061182e878288016116c3565b945050602061183f878288016116c3565b935050604061185087828801611741565b925050606085013567ffffffffffffffff81111561186d57600080fd5b61187987828801611717565b91505092959194509250565b6000806040838503121561189857600080fd5b60006118a6858286016116c3565b92505060206118b7858286016116d8565b9150509250929050565b600080604083850312156118d457600080fd5b60006118e2858286016116c3565b92505060206118f385828601611741565b9150509250929050565b60006020828403121561190f57600080fd5b600061191d848285016116ed565b91505092915050565b60006020828403121561193857600080fd5b600061194684828501611702565b91505092915050565b60006020828403121561196157600080fd5b600061196f84828501611741565b91505092915050565b61198181612029565b82525050565b6119908161203b565b82525050565b60006119a182611f2b565b6119ab8185611f41565b93506119bb8185602086016120ac565b6119c481612278565b840191505092915050565b60006119da82611f36565b6119e48185611f52565b93506119f48185602086016120ac565b6119fd81612278565b840191505092915050565b6000611a1382611f36565b611a1d8185611f63565b9350611a2d8185602086016120ac565b80840191505092915050565b6000611a46603283611f52565b9150611a5182612289565b604082019050919050565b6000611a69601c83611f52565b9150611a74826122d8565b602082019050919050565b6000611a8c602483611f52565b9150611a9782612301565b604082019050919050565b6000611aaf601983611f52565b9150611aba82612350565b602082019050919050565b6000611ad2602c83611f52565b9150611add82612379565b604082019050919050565b6000611af5603883611f52565b9150611b00826123c8565b604082019050919050565b6000611b18602a83611f52565b9150611b2382612417565b604082019050919050565b6000611b3b602983611f52565b9150611b4682612466565b604082019050919050565b6000611b5e602083611f52565b9150611b69826124b5565b602082019050919050565b6000611b81602c83611f52565b9150611b8c826124de565b604082019050919050565b6000611ba4602983611f52565b9150611baf8261252d565b604082019050919050565b6000611bc7602f83611f52565b9150611bd28261257c565b604082019050919050565b6000611bea602183611f52565b9150611bf5826125cb565b604082019050919050565b6000611c0d603183611f52565b9150611c188261261a565b604082019050919050565b611c2c81612093565b82525050565b6000611c3e8285611a08565b9150611c4a8284611a08565b91508190509392505050565b6000602082019050611c6b6000830184611978565b92915050565b6000608082019050611c866000830187611978565b611c936020830186611978565b611ca06040830185611c23565b8181036060830152611cb28184611996565b905095945050505050565b6000602082019050611cd26000830184611987565b92915050565b60006020820190508181036000830152611cf281846119cf565b905092915050565b60006020820190508181036000830152611d1381611a39565b9050919050565b60006020820190508181036000830152611d3381611a5c565b9050919050565b60006020820190508181036000830152611d5381611a7f565b9050919050565b60006020820190508181036000830152611d7381611aa2565b9050919050565b60006020820190508181036000830152611d9381611ac5565b9050919050565b60006020820190508181036000830152611db381611ae8565b9050919050565b60006020820190508181036000830152611dd381611b0b565b9050919050565b60006020820190508181036000830152611df381611b2e565b9050919050565b60006020820190508181036000830152611e1381611b51565b9050919050565b60006020820190508181036000830152611e3381611b74565b9050919050565b60006020820190508181036000830152611e5381611b97565b9050919050565b60006020820190508181036000830152611e7381611bba565b9050919050565b60006020820190508181036000830152611e9381611bdd565b9050919050565b60006020820190508181036000830152611eb381611c00565b9050919050565b6000602082019050611ecf6000830184611c23565b92915050565b6000611edf611ef0565b9050611eeb8282612111565b919050565b6000604051905090565b600067ffffffffffffffff821115611f1557611f14612249565b5b611f1e82612278565b9050602081019050919050565b600081519050919050565b600081519050919050565b600082825260208201905092915050565b600082825260208201905092915050565b600081905092915050565b6000611f7982612093565b9150611f8483612093565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115611fb957611fb86121bc565b5b828201905092915050565b6000611fcf82612093565b9150611fda83612093565b925082611fea57611fe96121eb565b5b828204905092915050565b600061200082612093565b915061200b83612093565b92508282101561201e5761201d6121bc565b5b828203905092915050565b600061203482612073565b9050919050565b60008115159050919050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b82818337600083830152505050565b60005b838110156120ca5780820151818401526020810190506120af565b838111156120d9576000848401525b50505050565b600060028204905060018216806120f757607f821691505b6020821081141561210b5761210a61221a565b5b50919050565b61211a82612278565b810181811067ffffffffffffffff8211171561213957612138612249565b5b80604052505050565b600061214d82612093565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156121805761217f6121bc565b5b600182019050919050565b600061219682612093565b91506121a183612093565b9250826121b1576121b06121eb565b5b828206905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000601f19601f8301169050919050565b7f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560008201527f63656976657220696d706c656d656e7465720000000000000000000000000000602082015250565b7f4552433732313a20746f6b656e20616c7265616479206d696e74656400000000600082015250565b7f4552433732313a207472616e7366657220746f20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b7f4552433732313a20617070726f766520746f2063616c6c657200000000000000600082015250565b7f4552433732313a206f70657261746f7220717565727920666f72206e6f6e657860008201527f697374656e7420746f6b656e0000000000000000000000000000000000000000602082015250565b7f4552433732313a20617070726f76652063616c6c6572206973206e6f74206f7760008201527f6e6572206e6f7220617070726f76656420666f7220616c6c0000000000000000602082015250565b7f4552433732313a2062616c616e636520717565727920666f7220746865207a6560008201527f726f206164647265737300000000000000000000000000000000000000000000602082015250565b7f4552433732313a206f776e657220717565727920666f72206e6f6e657869737460008201527f656e7420746f6b656e0000000000000000000000000000000000000000000000602082015250565b7f4552433732313a206d696e7420746f20746865207a65726f2061646472657373600082015250565b7f4552433732313a20617070726f76656420717565727920666f72206e6f6e657860008201527f697374656e7420746f6b656e0000000000000000000000000000000000000000602082015250565b7f4552433732313a207472616e73666572206f6620746f6b656e2074686174206960008201527f73206e6f74206f776e0000000000000000000000000000000000000000000000602082015250565b7f4552433732314d657461646174613a2055524920717565727920666f72206e6f60008201527f6e6578697374656e7420746f6b656e0000000000000000000000000000000000602082015250565b7f4552433732313a20617070726f76616c20746f2063757272656e74206f776e6560008201527f7200000000000000000000000000000000000000000000000000000000000000602082015250565b7f4552433732313a207472616e736665722063616c6c6572206973206e6f74206f60008201527f776e6572206e6f7220617070726f766564000000000000000000000000000000602082015250565b61267281612029565b811461267d57600080fd5b50565b6126898161203b565b811461269457600080fd5b50565b6126a081612047565b81146126ab57600080fd5b50565b6126b781612093565b81146126c257600080fd5b5056fea2646970667358221220c7624dbf778ada509ee939b21f820e163de7f509e81c6988ca2659580d1c50db64736f6c63430008020033';

export class ERC721__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ERC721> {
    return super.deploy(overrides || {}) as Promise<ERC721>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ERC721 {
    return super.attach(address) as ERC721;
  }
  connect(signer: Signer): ERC721__factory {
    return super.connect(signer) as ERC721__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC721Interface {
    return new utils.Interface(_abi) as ERC721Interface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): ERC721 {
    return new Contract(address, _abi, signerOrProvider) as ERC721;
  }
}
