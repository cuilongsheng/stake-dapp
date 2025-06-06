"use client";

import React, { useEffect, useState } from "react";
import {
  MetaNodeStakeAddress,
  MetaNodeStakeAbi,
} from "@/contracts/metaNodeStake";
import { PoolInfo } from "@/types/stake";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { formatEther } from "viem";
import { toast } from "react-toastify";
import { motion } from "motion/react";
import { useContractInstance } from "@/hooks/useContractInstance";
import { waitForTransactionReceipt } from "viem/actions";
import {
  getCardClasses,
  getButtonClasses,
  textStyles,
  backgroundStyles,
  borderStyles,
} from "@/utils/theme";
import { erc20ABI, getERC20Address } from "@/contracts/erc20";

const ManagePool: React.FC<{
  pid: number;
  refetchPoolLength: () => void;
}> = ({ pid, refetchPoolLength }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string>("ETH");
  const [tokenTotalSupply, setTokenTotalSupply] = useState<string>("0");
  const [claimPaused, setClaimPaused] = useState<boolean>(false);
  const [withdrawPaused, setWithdrawPaused] = useState<boolean>(false);

  // 质押合约实例
  const { readContract: readStakeContract, canRead: canReadStake } =
    useContractInstance(
      MetaNodeStakeAddress as `0x${string}`,
      MetaNodeStakeAbi
    );

  // Token contract instance for reading token info
  const isETHPool = pid === 0;
  const { readContract: readTokenContract, canRead: canReadToken } =
    useContractInstance(
      isETHPool
        ? getERC20Address(chainId)
        : (pool?.stTokenAddress as `0x${string}`),
      erc20ABI
    );

  // 获取池子信息
  const getPoolInfo = async () => {
    if (!readStakeContract || !canReadStake) return;

    try {
      const poolInfo = await readStakeContract.read.pool([pid]);
      const [
        stTokenAddress,
        poolWeight,
        lastRewardBlock,
        accMetaNodePerST,
        stTokenAmount,
        minDepositAmount,
        unstakeLockedBlocks,
      ] = poolInfo as [
        `0x${string}`,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint
      ];

      setPool({
        stTokenAddress,
        poolWeight,
        lastRewardBlock,
        accMetaNodePerST,
        stTokenAmount,
        minDepositAmount,
        unstakeLockedBlocks,
      });
    } catch (error) {
      console.error("获取池子信息失败:", error);
    }
  };

  // 获取暂停状态
  const getPauseStatus = async () => {
    if (!readStakeContract || !canReadStake) return;

    try {
      const [claimPausedStatus, withdrawPausedStatus] = await Promise.all([
        readStakeContract.read.claimPaused(),
        readStakeContract.read.withdrawPaused(),
      ]);

      setClaimPaused(claimPausedStatus as boolean);
      setWithdrawPaused(withdrawPausedStatus as boolean);
    } catch (error) {
      console.error("获取暂停状态失败:", error);
    }
  };

  // 获取代币信息
  const getTokenInfo = async () => {
    if (!pool) return;

    if (readTokenContract && canReadToken && pool.stTokenAddress) {
      // 分别尝试获取symbol和totalSupply，避免一个失败影响另一个
      let symbol = "未知";
      let totalSupply = "0";

      // 尝试获取symbol
      try {
        const _symbol = await readTokenContract.read.symbol();
        symbol = _symbol as string;
      } catch (error) {
        // 静默处理错误，不输出到控制台避免干扰
        symbol = "未知代币";
      }

      // 尝试获取totalSupply
      try {
        const _balance = await readTokenContract.read.balanceOf([address]);
        totalSupply = formatEther(_balance as bigint);
      } catch (error) {
        console.error("获取代币总供应量失败:", error);
        // 静默处理错误
        totalSupply = "未知";
      }

      setTokenSymbol(symbol);
      setTokenTotalSupply(totalSupply);
    } else {
      // 如果无法创建代币合约实例，设置为未知
      setTokenSymbol("未知");
      setTokenTotalSupply("未知");
    }
  };

  useEffect(() => {
    if (isConnected) {
      getPoolInfo();
      getPauseStatus();
    }
  }, [isConnected, pid, readStakeContract, canReadStake]);

  useEffect(() => {
    if (pool) {
      getTokenInfo();
    }
  }, [pool, readTokenContract, canReadToken, isETHPool]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={getCardClasses()}
    >
      {/* 卡片头部 */}
      <div className={`px-4 py-3 border-b ${borderStyles.default}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${textStyles.heading}`}>
              池子 #{pid}
            </h3>
            <p className={`text-sm mt-1 ${textStyles.muted}`}>
              {isETHPool ? "ETH 质押池" : `${tokenSymbol} 代币质押池`}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* 基本信息 */}
        <div className="flex flex-wrap items-center gap-6 text-sm border-b border-gray-200 dark:border-gray-700 pb-3">
          <div className="flex items-center space-x-2">
            <span className={`${textStyles.muted}`}>代币地址:</span>
            <span className={`font-mono`}>
              {isETHPool
                ? "ETH"
                : `${pool?.stTokenAddress?.slice(
                    0,
                    6
                  )}...${pool?.stTokenAddress?.slice(-4)}`}
            </span>
            {!isETHPool && (
              <button
                onClick={() => {
                  if (pool?.stTokenAddress) {
                    navigator.clipboard.writeText(pool.stTokenAddress);
                    toast.success("地址已复制");
                  }
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
              >
                复制
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className={`${textStyles.muted}`}>代币符号:</span>
            <span className={`font-semibold`}>{tokenSymbol}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`${textStyles.muted}`}>总供应量:</span>
            <span className={`font-semibold`}>{tokenTotalSupply}</span>
          </div>
        </div>

        {/* 状态显示 */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className={`${textStyles.muted}`}>领取状态:</span>
            <span
              className={`font-semibold ${
                claimPaused
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {claimPaused ? "已暂停" : "正常"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`${textStyles.muted}`}>提现状态:</span>
            <span
              className={`font-semibold ${
                withdrawPaused
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {withdrawPaused ? "已暂停" : "正常"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ManagePool;
