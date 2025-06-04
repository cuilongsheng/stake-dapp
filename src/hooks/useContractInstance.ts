import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import {
  Abi,
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
} from "viem";
import { sepolia } from "viem/chains";
import { http } from "viem";
import { useMemo } from "react";

// // 创建公共客户端
// const publicClient = createPublicClient({
//   chain: sepolia,
//   transport: http(
//     `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
//   ),
// });

// 只在客户端环境中创建钱包客户端
// const createWalletClientInstance = () => {
//   if (typeof window !== "undefined" && window.ethereum) {
//     return createWalletClient({
//       chain: sepolia,
//       transport: custom(window.ethereum),
//     });
//   }
//   return null;
// };

export const useContractInstance = (
  tokenAddress: `0x${string}`,
  tokenAbi: Abi
) => {
  const chainId = useChainId();
  const publicClient = usePublicClient({
    chainId: chainId,
  });

  const { data: walletClient } = useWalletClient({
    chainId: chainId,
  });

  // 创建只读合约实例（用于读取数据）
  const readContract = useMemo(() => {
    if (!tokenAddress || !tokenAbi || !publicClient) return null;

    return getContract({
      address: tokenAddress,
      abi: tokenAbi,
      client: publicClient,
    });
  }, [tokenAddress, tokenAbi, publicClient]);

  // 创建可写合约实例（用于发送交易）
  const writeContract = useMemo(() => {
    if (!tokenAddress || !tokenAbi || !walletClient) return null;

    return getContract({
      address: tokenAddress,
      abi: tokenAbi,
      client: walletClient,
    });
  }, [tokenAddress, tokenAbi, walletClient]);

  // 返回合约实例和连接状态
  return {
    readContract, // 用于读取合约数据
    writeContract, // 用于发送交易
    isConnected: !!walletClient,
    canRead: !!readContract,
    canWrite: !!writeContract,
  };
};
