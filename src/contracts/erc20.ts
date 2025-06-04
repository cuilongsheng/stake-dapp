import { Abi } from "viem";
import { sepolia, mainnet } from "viem/chains";

// 不同网络的合约地址
const contractAddresses: Record<number, `0x${string}`> = {
  [sepolia.id]: "0xC9653895302caD170124887666456606934495F0", // Sepolia 测试网的 LINK 代币
  // [mainnet.id]: "0xA0b86a33E6441D81B7Ba23FD92D19C5ec5F4e158", // 主网的 LINK 代币 (示例)
};

// 获取当前网络的合约地址
export const getERC20Address = (chainId: number): `0x${string}` => {
  if (!chainId) {
    throw new Error(`不支持的网络 Chain ID: ${chainId}`);
  }
  const address = contractAddresses[chainId];

  return address;
};

// 默认使用 Sepolia 网络地址
export const erc20Address: `0x${string}` = contractAddresses[sepolia.id];

// 完整的 ERC20 ABI
export const erc20ABI: Abi = [
  // 查看函数
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  // 写入函数
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  // 事件
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Approval",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

// 如果合约支持 mint 功能的 ABI（仅在确认合约有此功能时使用）
export const erc20WithMintABI: Abi = [
  ...erc20ABI,
  // 管理员函数（仅在合约支持时添加）
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;
