"use client";

import React from "react";
import {
  MetaNodeStakeAddress,
  MetaNodeStakeAbi,
} from "@/contracts/metaNodeStake";
import { IRequest, PoolInfo, UserInfo, WithdrawAmount } from "@/types/stake";
import { useEffect, useState, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { toast } from "react-toastify";
import { motion } from "motion/react";
import {
  getCardClasses,
  getInputClasses,
  getButtonClasses,
  textStyles,
  backgroundStyles,
  borderStyles,
} from "@/utils/theme";

const DepositePool: React.FC<{
  pid: number;
  walletAddress: string;
  refetchBalance: () => void;
}> = ({ pid, walletAddress, refetchBalance }) => {
  const { isConnected } = useAccount();
  const [hash, setHash] = useState<string | null>(null);
  const [rewardHash, setRewardHash] = useState<string | null>(null);
  const [unstakeHash, setUnstakeHash] = useState<string | null>(null);
  const [withdrawHash, setWithdrawHash] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");
  const [pool, setPool] = useState<PoolInfo | null>(null);

  // 按钮的loading状态
  const [isDepositing, setIsDepositing] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 获取池子信息
  const { data: poolInfo, refetch: refetchPoolInfo } = useReadContract({
    address: MetaNodeStakeAddress,
    abi: MetaNodeStakeAbi,
    functionName: "pool",
    args: [pid],
  });

  useEffect(() => {
    if (poolInfo) {
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
    }
  }, [poolInfo]);

  // 获取用户信息（包括已领取奖励）
  const {
    data: userInfo,
    refetch: refetchUserInfo,
    error: userInfoError,
    isLoading: userInfoLoading,
  } = useReadContract({
    address: MetaNodeStakeAddress,
    abi: MetaNodeStakeAbi,
    functionName: "user",
    args: [pid, walletAddress as `0x${string}`],
    query: {
      enabled: isConnected && !!walletAddress,
    },
  });

  const [userInfoData, setUserInfoData] = useState<UserInfo | null>(null);
  useEffect(() => {
    if (userInfo) {
      try {
        const [stAmount, finishedMetaNode, pendingMetaNode] = userInfo as [
          bigint,
          bigint,
          bigint
        ];
        setUserInfoData({
          stAmount,
          finishedMetaNode,
          pendingMetaNode,
          requests: [], // 暂时设为空数组，因为user函数不返回requests
        });
      } catch (error) {
        console.error("Error parsing userInfo:", error);
      }
    } else {
      console.log("userInfo is null/undefined");
    }
  }, [userInfo]);

  // 获取可提现金额
  const { data: withdrawAmount, refetch: refetchWithdrawAmount } =
    useReadContract({
      address: MetaNodeStakeAddress,
      abi: MetaNodeStakeAbi,
      functionName: "withdrawAmount",
      args: [pid, walletAddress as `0x${string}`],
      query: {
        enabled: isConnected && !!walletAddress,
      },
    });

  // 获取池中待处理的MetaNode用户数量
  const { data: pendingUserCount, refetch: refetchPendingUserCount } =
    useReadContract({
      address: MetaNodeStakeAddress,
      abi: MetaNodeStakeAbi,
      functionName: "pendingMetaNode",
      args: [pid, walletAddress as `0x${string}`],
      query: {
        enabled: isConnected && !!walletAddress,
      },
    });

  // 获取质押余额
  const { data: stakingBalance, refetch: refetchStakingBalance } =
    useReadContract({
      address: MetaNodeStakeAddress,
      abi: MetaNodeStakeAbi,
      functionName: "stakingBalance",
      args: [pid, walletAddress as `0x${string}`],
      query: {
        enabled: isConnected && !!walletAddress,
      },
    });

  // 获取全局暂停状态（这些是全局设置，不是针对特定池子）
  const { data: claimPaused } = useReadContract({
    address: MetaNodeStakeAddress,
    abi: MetaNodeStakeAbi,
    functionName: "claimPaused",
    query: {
      enabled: isConnected,
    },
  });

  const { data: withdrawPaused } = useReadContract({
    address: MetaNodeStakeAddress,
    abi: MetaNodeStakeAbi,
    functionName: "withdrawPaused",
    query: {
      enabled: isConnected,
    },
  });

  // 计算池子状态（基于全局暂停状态）
  const poolStatus = useMemo(() => {
    const isClaimPaused = claimPaused as boolean;
    const isWithdrawPaused = withdrawPaused as boolean;

    if (isClaimPaused && isWithdrawPaused) {
      return {
        text: "功能暂停",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-400",
      };
    } else if (isClaimPaused) {
      return {
        text: "领取暂停",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-400",
      };
    } else if (isWithdrawPaused) {
      return {
        text: "提现暂停",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-400",
      };
    } else {
      return {
        text: "活跃中",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-400",
      };
    }
  }, [claimPaused, withdrawPaused]);

  const { writeContractAsync } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });
  const { data: rewardReceipt } = useWaitForTransactionReceipt({
    hash: rewardHash as `0x${string}`,
  });
  const { data: unstakeReceipt } = useWaitForTransactionReceipt({
    hash: unstakeHash as `0x${string}`,
  });
  const { data: withdrawReceipt } = useWaitForTransactionReceipt({
    hash: withdrawHash as `0x${string}`,
  });

  // 质押交易处理
  useEffect(() => {
    if (receipt?.status === "success") {
      // 质押成功后刷新: 质押余额、可提现金额、待处理奖励、用户信息、池子信息
      refetchStakingBalance();
      refetchWithdrawAmount();
      refetchPendingUserCount();
      refetchUserInfo();
      refetchPoolInfo();
      if (typeof refetchBalance === "function") {
        refetchBalance();
      }
      toast.success("质押成功");
      setIsDepositing(false);
    } else if (receipt?.status === "reverted") {
      toast.error("质押失败");
      setIsDepositing(false);
    }
    setHash(null);
  }, [receipt]);

  // 领取奖励交易处理
  useEffect(() => {
    if (rewardReceipt?.status === "success") {
      // 领取奖励成功后刷新: 待处理奖励、用户信息
      refetchPendingUserCount();
      refetchUserInfo();
      toast.success("领取奖励成功");
      setIsClaimingReward(false);
    } else if (rewardReceipt?.status === "reverted") {
      toast.error("领取奖励失败");
      setIsClaimingReward(false);
    }
    setRewardHash(null);
  }, [rewardReceipt]);

  // 申请提现交易处理
  useEffect(() => {
    if (unstakeReceipt?.status === "success") {
      // 申请提现成功后刷新: 质押余额、可提现金额、待处理奖励、用户信息、池子信息
      refetchStakingBalance();
      refetchWithdrawAmount();
      refetchPendingUserCount();
      refetchUserInfo();
      refetchPoolInfo();
      toast.success("申请提现成功");
      setIsUnstaking(false);
    } else if (unstakeReceipt?.status === "reverted") {
      toast.error("申请提现失败");
      setIsUnstaking(false);
    }
    setUnstakeHash(null);
  }, [unstakeReceipt]);

  // 提取资金交易处理
  useEffect(() => {
    if (withdrawReceipt?.status === "success") {
      // 提取成功后刷新: 质押余额、可提现金额、待处理奖励、用户信息、池子信息
      refetchStakingBalance();
      refetchWithdrawAmount();
      refetchPendingUserCount();
      refetchUserInfo();
      refetchPoolInfo();
      if (typeof refetchBalance === "function") {
        refetchBalance();
      }
      toast.success("提取成功");
      setIsWithdrawing(false);
    } else if (withdrawReceipt?.status === "reverted") {
      toast.error("提取失败");
      setIsWithdrawing(false);
    }
    setWithdrawHash(null);
  }, [withdrawReceipt]);

  const handleDeposite = async () => {
    if (!amount) {
      toast.error("请输入质押金额");
      return;
    }
    try {
      setIsDepositing(true);
      const _amount = parseEther(amount);
      const hash = await writeContractAsync({
        address: MetaNodeStakeAddress,
        abi: MetaNodeStakeAbi,
        functionName: "depositETH",
        args: [],
        value: _amount,
      });
      setHash(hash);
      toast.info("交易已提交，等待确认...");
    } catch (error: any) {
      console.error("质押失败:", error);
      // 检查是否是用户取消操作
      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("User denied") ||
        error.code === 4001
      ) {
        toast.info("用户取消了操作");
      } else {
        toast.error("质押失败");
      }
      setIsDepositing(false);
    }
  };

  const handleWithdrawReward = async () => {
    if (!userInfoData?.pendingMetaNode) {
      toast.error("暂无待领取奖励");
      return;
    }
    try {
      setIsClaimingReward(true);
      const _hash = await writeContractAsync({
        address: MetaNodeStakeAddress,
        abi: MetaNodeStakeAbi,
        functionName: "claim",
        args: [pid],
      });
      setRewardHash(_hash);
      toast.info("领取交易已提交，等待确认...");
    } catch (error: any) {
      console.error("领取失败:", error);
      // 检查是否是用户取消操作
      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("User denied") ||
        error.code === 4001
      ) {
        toast.info("用户取消了操作");
      } else {
        toast.error("领取失败");
      }
      setIsClaimingReward(false);
    }
  };

  // 申请提现 (unstake)
  const handleUnstake = async () => {
    if (!unstakeAmount) {
      toast.error("请输入提现金额");
      return;
    }
    if (!stakingBalance) {
      toast.error("暂无质押余额");
      return;
    }
    try {
      setIsUnstaking(true);
      const _amount = parseEther(unstakeAmount);
      const _hash = await writeContractAsync({
        address: MetaNodeStakeAddress,
        abi: MetaNodeStakeAbi,
        functionName: "unstake",
        args: [pid, _amount],
      });
      setUnstakeHash(_hash);
      toast.info("申请提现交易已提交，等待确认...");
    } catch (error: any) {
      console.error("申请提现失败:", error);
      // 检查是否是用户取消操作
      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("User denied") ||
        error.code === 4001
      ) {
        toast.info("用户取消了操作");
      } else {
        toast.error("申请提现失败");
      }
      setIsUnstaking(false);
    }
  };

  // 提取已解锁的资金 (withdraw)
  const handleWithdraw = async () => {
    const pendingWithdrawAmount = withdrawAmount
      ? (withdrawAmount as [bigint, bigint])[1]
      : BigInt(0);
    if (!pendingWithdrawAmount || pendingWithdrawAmount === BigInt(0)) {
      toast.error("暂无可提取的资金");
      return;
    }
    try {
      setIsWithdrawing(true);
      const _hash = await writeContractAsync({
        address: MetaNodeStakeAddress,
        abi: MetaNodeStakeAbi,
        functionName: "withdraw",
        args: [pid],
      });
      setWithdrawHash(_hash);
      toast.info("提取交易已提交，等待确认...");
    } catch (error: any) {
      // console.error("提取失败:", error);
      // 检查是否是用户取消操作
      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("User denied") ||
        error.code === 4001
      ) {
        toast.info("用户取消了操作");
      } else {
        toast.error("提取失败");
      }
      setIsWithdrawing(false);
    }
  };

  const formatAmount = (value: bigint | undefined) => {
    if (!value) return "0.0000";
    return Number(formatEther(value)).toFixed(4);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={getCardClasses()}
    >
      {/* 卡片头部 */}
      <div className={`px-6 py-4 border-b ${borderStyles.default}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${textStyles.heading}`}>
              质押池 #{pid}
            </h3>
            <p className={`text-sm mt-1 ${textStyles.muted}`}>
              {pool?.stTokenAddress ===
              "0x0000000000000000000000000000000000000000"
                ? "ETH 质押池"
                : "代币质押池"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${poolStatus.bgColor} ${
                poolStatus.text === "活跃中" ? "animate-pulse" : ""
              }`}
            ></div>
            <span className={`text-xs font-medium ${poolStatus.color}`}>
              {poolStatus.text}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 统计信息网格 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 border ${backgroundStyles.accent.blue} ${borderStyles.accent.blue}`}
          >
            <div className="text-center">
              <p className="text-xs font-medium mb-1 text-blue-600 dark:text-blue-300">
                质押余额
              </p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {formatAmount(stakingBalance as bigint)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Token</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 border ${backgroundStyles.accent.green} ${borderStyles.accent.green}`}
          >
            <div className="text-center">
              <p className="text-xs font-medium mb-1 text-emerald-600 dark:text-emerald-300">
                待领取奖励
              </p>
              <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                {formatAmount(userInfoData?.pendingMetaNode || BigInt(0))}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                MetaNode
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 border ${backgroundStyles.accent.purple} ${borderStyles.accent.purple}`}
          >
            <div className="text-center">
              <p className="text-xs font-medium mb-1 text-purple-600 dark:text-purple-300">
                已领取奖励
              </p>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {userInfoData
                  ? formatAmount(userInfoData.finishedMetaNode)
                  : "0.0000"}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                MetaNode
              </p>
            </div>
          </motion.div>
        </div>

        {/* 操作区域 */}
        <div className="space-y-4">
          {/* 质押区域 */}
          <div
            className={`rounded-xl p-4 border ${backgroundStyles.card} ${borderStyles.default}`}
          >
            <h4 className={`text-sm font-semibold mb-3 ${textStyles.heading}`}>
              质押 Token
            </h4>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="输入质押金额"
                  disabled={!isConnected}
                  className={`w-full ${getInputClasses()}`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className={`text-sm font-medium ${textStyles.muted}`}>
                    Token
                  </span>
                </div>
              </div>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleDeposite}
                disabled={!isConnected || !amount || isDepositing}
                className={`w-full ${getButtonClasses("primary")}`}
              >
                {isDepositing && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isDepositing ? "质押中..." : "质押 Token"}</span>
              </motion.button>
            </div>
          </div>

          {/* 操作按钮组 */}
          <div className="space-y-4">
            {/* 申请提现区域 */}
            <div
              className={`rounded-xl p-4 border bg-gray-50/80 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600`}
            >
              <h4
                className={`text-sm font-semibold mb-3 ${textStyles.heading}`}
              >
                申请提现
              </h4>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="输入提现金额"
                    disabled={!isConnected}
                    className={`w-full ${getInputClasses()}`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className={`text-sm font-medium ${textStyles.muted}`}>
                      Token
                    </span>
                  </div>
                </div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleUnstake}
                  disabled={
                    !unstakeAmount || Number(unstakeAmount) <= 0 || isUnstaking
                  }
                  className={`w-full ${getButtonClasses("warning")}`}
                >
                  {isUnstaking && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isUnstaking ? "申请中..." : "申请提现"}</span>
                </motion.button>
              </div>
            </div>

            {/* 申请提现状态信息 */}
            {withdrawAmount ? (
              <React.Fragment>
                <div className="rounded-xl p-4 border bg-gray-50/60 dark:bg-gray-700/30 border-gray-100 dark:border-gray-600">
                  <h5
                    className={`text-xs font-semibold mb-2 ${textStyles.muted}`}
                  >
                    提现状态信息
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      className={`rounded-lg p-3 border ${backgroundStyles.accent.amber} ${borderStyles.accent.amber}`}
                    >
                      <p className="text-xs font-medium mb-1 text-amber-600 dark:text-amber-300">
                        申请中金额
                      </p>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                        {formatAmount(
                          (withdrawAmount as [bigint, bigint])[0] -
                            (withdrawAmount as [bigint, bigint])[1]
                        )}{" "}
                        Token
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        锁定中
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-3 border ${backgroundStyles.accent.green} ${borderStyles.accent.green}`}
                    >
                      <p className="text-xs font-medium mb-1 text-green-600 dark:text-green-300">
                        可提取金额
                      </p>
                      <p className="text-sm font-bold text-green-900 dark:text-green-100">
                        {formatAmount((withdrawAmount as [bigint, bigint])[1])}{" "}
                        Token
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        立即可用
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-3 border ${backgroundStyles.accent.blue} ${borderStyles.accent.blue}`}
                    >
                      <p className="text-xs font-medium mb-1 text-blue-600 dark:text-blue-300">
                        锁定期
                      </p>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        {pool?.unstakeLockedBlocks?.toString() || "0"}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        区块数
                      </p>
                    </div>
                  </div>
                  {/* {(withdrawAmount as [bigint, bigint])[0] > 0n && (
                    <div className="mt-3 p-3 rounded-lg border bg-green-50/80 dark:bg-green-900/20 border-green-100 dark:border-green-700/50">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          申请提现已提交，等待锁定期结束后可提取资金
                        </p>
                      </div>
                    </div>
                  )} */}
                </div>
              </React.Fragment>
            ) : null}

            {/* 其他操作按钮 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleWithdrawReward}
                disabled={
                  !isConnected ||
                  isClaimingReward ||
                  !userInfoData?.pendingMetaNode ||
                  userInfoData.pendingMetaNode === BigInt(0) ||
                  (claimPaused as boolean)
                }
                className={getButtonClasses("success")}
              >
                {isClaimingReward && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isClaimingReward ? "领取中..." : "领取奖励"}</span>
              </motion.button>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleWithdraw}
                disabled={
                  !withdrawAmount ||
                  !(withdrawAmount as [bigint, bigint])[1] ||
                  (withdrawAmount as [bigint, bigint])[1] === BigInt(0) ||
                  isWithdrawing
                }
                className={getButtonClasses("secondary")}
              >
                {isWithdrawing && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isWithdrawing ? "提取中..." : "提取资金"}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* 交易哈希显示 */}
        {(hash || rewardHash || unstakeHash || withdrawHash) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl p-3 border bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600"
          >
            <p className={`text-xs mb-1 ${textStyles.muted}`}>交易哈希:</p>
            <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">
              {hash || rewardHash || unstakeHash || withdrawHash}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DepositePool;
