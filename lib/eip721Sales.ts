import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useQuery } from 'urql';

const NFT_EXCHANGES = {
  '0x5206e78b21ce315ce284fb24cf05e0585a93b1d9': 'OpenSea',
  '0xE7dd1252f50B3d845590Da0c5eADd985049a03ce': 'Zora',
};

const PAYMENT_TOKENS = {
  '0x0': 'ETH',
  '0xc778417e063141139fce010982780140aa0cd5ab': 'WETH',
  '0x6916577695D0774171De3ED95d03A3239139Eddb': 'DAI',
};

export interface NFTSaleEntity {
  id: string;
  nftContractAddress: string;
  nftTokenId: string;
  saleType: string;
  blockNumber: number;
  timestamp: number;
  seller: string;
  buyer: string;
  exchange: string;
  paymentToken: string;
  price: number;
}

export const HIDDEN_NFT_ADDRESSES = [
  !!process.env.NEXT_PUBLIC_BORROW_TICKET_CONTRACT
    ? process.env.NEXT_PUBLIC_BORROW_TICKET_CONTRACT.toLowerCase()
    : '',
  !!process.env.NEXT_PUBLIC_LEND_TICKET_CONTRACT
    ? process.env.NEXT_PUBLIC_LEND_TICKET_CONTRACT.toLowerCase()
    : '',
];

const genRanHex = (size: number = 40) =>
  '0x' +
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

const randomNumber = (upperBound: number) =>
  Math.floor(Math.random() * (upperBound + 1));

export const generateFakeSaleForNFT = (
  nftContractAddress: string,
  nftTokenId: string,
): NFTSaleEntity => {
  return {
    id: genRanHex(),
    blockNumber: randomNumber(1000000),
    buyer: genRanHex(),
    seller: genRanHex(),
    nftContractAddress,
    nftTokenId,
    saleType: 'SINGLE',
    paymentToken: Object.keys(PAYMENT_TOKENS)[randomNumber(2)],
    price: randomNumber(1000),
    exchange: Object.keys(NFT_EXCHANGES)[randomNumber(1)],
    timestamp: new Date().getSeconds(),
  };
};
