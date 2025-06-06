"use client";
import { useEffect, useMemo, useState } from "react";
import { erc20ABI, getERC20Address } from "@/contracts/erc20";
import {
  useAccount,
  useChainId,
  useWalletClient,
  useReadContract,
} from "wagmi";
import { useContractInstance } from "@/hooks/useContractInstance";
import {
  MetaNodeStakeAbi,
  MetaNodeStakeAddress,
} from "@/contracts/metaNodeStake";
import { Button } from "@mui/material";
import { toast } from "react-toastify";
import { waitForTransactionReceipt } from "viem/actions";
import ManagePool from "@/components/ManagePool";
import { motion } from "motion/react";
import {
  getCardClasses,
  getButtonClasses,
  textStyles,
  backgroundStyles,
  borderStyles,
} from "@/utils/theme";

function Page() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [poolLength, setPoolLength] = useState<number>(0);

  // 获取网络名称
  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "以太坊主网";
      case 11155111:
        return "Sepolia 测试网";
      case 8453:
        return "Base 主网";
      case 84532:
        return "Base Sepolia 测试网";
      default:
        return `网络 ID: ${chainId}`;
    }
  };

  // 获取池子数量
  const { data: poolLengthData, refetch: refetchPoolLength } = useReadContract({
    address: MetaNodeStakeAddress,
    abi: MetaNodeStakeAbi,
    functionName: "poolLength",
    query: {
      enabled: isConnected,
    },
  });

  useEffect(() => {
    if (poolLengthData) {
      setPoolLength(Number(poolLengthData));
    }
  }, [poolLengthData]);

  // 合约实例
  const { writeContract: writeContractStake, canWrite: canWriteStake } =
    useContractInstance(
      MetaNodeStakeAddress as `0x${string}`,
      MetaNodeStakeAbi
    );

  // 获取池子ID数组
  const poolIds = useMemo(() => {
    return Array.from({ length: poolLength }, (_, i) => i);
  }, [poolLength]);

  // 添加池子的状态和函数
  const [showAddPoolForm, setShowAddPoolForm] = useState(false);
  const [newPoolAddress, setNewPoolAddress] = useState("");
  const [newPoolWeight, setNewPoolWeight] = useState("100");
  const [newMinDeposit, setNewMinDeposit] = useState("0.001");
  const [newUnlockBlocks, setNewUnlockBlocks] = useState("10");

  // 添加池子
  const addPool = async () => {
    if (!writeContractStake || !canWriteStake || !walletClient) {
      toast.error("钱包未连接或合约实例未准备好");
      return;
    }

    // 验证输入
    if (
      !newPoolAddress ||
      !newPoolAddress.startsWith("0x") ||
      newPoolAddress.length !== 42
    ) {
      toast.error("请输入有效的合约地址");
      return;
    }

    try {
      const weight = parseInt(newPoolWeight);
      const minDeposit = BigInt(Math.floor(parseFloat(newMinDeposit) * 1e18));
      const unlockBlocks = parseInt(newUnlockBlocks);

      // 使用writeContract进行写入操作
      const tx = await writeContractStake.write.addPool([
        newPoolAddress as `0x${string}`,
        weight,
        minDeposit,
        unlockBlocks,
        false,
      ]);

      const res = await waitForTransactionReceipt(walletClient, { hash: tx });
      if (res.status === "success") {
        toast.success("池子添加成功！交易哈希: " + tx);
        // 重置表单
        setNewPoolAddress("");
        setNewPoolWeight("100");
        setNewMinDeposit("0.001");
        setNewUnlockBlocks("10");
        setShowAddPoolForm(false);
        // 重新获取池子信息
        setTimeout(() => {
          refetchPoolLength();
        }, 2000);
      } else {
        toast.error("池子添加失败！交易哈希: " + tx);
      }
    } catch (error: any) {
      console.error("添加池子失败:", error);
      // 检查是否是用户取消操作
      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("User denied") ||
        error.code === 4001
      ) {
        toast.info("用户取消了操作");
      } else {
        toast.error("添加池子失败: " + (error.message || "未知错误"));
      }
    }
  };

  // 全局暂停控制组件
  const GlobalPauseControls = () => {
    const [claimPaused, setClaimPaused] = useState<boolean>(false);
    const [withdrawPaused, setWithdrawPaused] = useState<boolean>(false);
    const [isPausingClaim, setIsPausingClaim] = useState(false);
    const [isUnpausingClaim, setIsUnpausingClaim] = useState(false);
    const [isPausingWithdraw, setIsPausingWithdraw] = useState(false);
    const [isUnpausingWithdraw, setIsUnpausingWithdraw] = useState(false);

    // 读取合约实例
    const { readContract: readStakeContract, canRead: canReadStake } =
      useContractInstance(
        MetaNodeStakeAddress as `0x${string}`,
        MetaNodeStakeAbi
      );

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

    useEffect(() => {
      if (isConnected) {
        getPauseStatus();
      }
    }, [isConnected, readStakeContract, canReadStake]);

    // 暂停领取
    const handlePauseClaim = async () => {
      if (!writeContractStake || !canWriteStake || !walletClient) {
        toast.error("钱包未连接或合约实例未准备好");
        return;
      }

      try {
        setIsPausingClaim(true);
        const tx = await writeContractStake.write.pauseClaim();
        const res = await waitForTransactionReceipt(walletClient, { hash: tx });

        if (res.status === "success") {
          toast.success("暂停领取成功！");
          getPauseStatus();
          // 刷新页面以更新所有池子状态
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error("暂停领取失败！");
        }
      } catch (error: any) {
        console.error("暂停领取失败:", error);
        if (
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.code === 4001
        ) {
          toast.info("用户取消了操作");
        } else {
          toast.error("暂停领取失败: " + (error.message || "未知错误"));
        }
      } finally {
        setIsPausingClaim(false);
      }
    };

    // 恢复领取
    const handleUnpauseClaim = async () => {
      if (!writeContractStake || !canWriteStake || !walletClient) {
        toast.error("钱包未连接或合约实例未准备好");
        return;
      }

      try {
        setIsUnpausingClaim(true);
        const tx = await writeContractStake.write.unpauseClaim();
        const res = await waitForTransactionReceipt(walletClient, { hash: tx });

        if (res.status === "success") {
          toast.success("恢复领取成功！");
          getPauseStatus();
          // 刷新页面以更新所有池子状态
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          // 刷新页面以更新所有池子状态
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error("恢复领取失败！");
        }
      } catch (error: any) {
        console.error("恢复领取失败:", error);
        if (
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.code === 4001
        ) {
          toast.info("用户取消了操作");
        } else {
          toast.error("恢复领取失败: " + (error.message || "未知错误"));
        }
      } finally {
        setIsUnpausingClaim(false);
      }
    };

    // 暂停提现
    const handlePauseWithdraw = async () => {
      if (!writeContractStake || !canWriteStake || !walletClient) {
        toast.error("钱包未连接或合约实例未准备好");
        return;
      }

      try {
        setIsPausingWithdraw(true);
        const tx = await writeContractStake.write.pauseWithdraw();
        const res = await waitForTransactionReceipt(walletClient, { hash: tx });

        if (res.status === "success") {
          toast.success("暂停提现成功！");
          getPauseStatus();
          // 刷新页面以更新所有池子状态
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error("暂停提现失败！");
        }
      } catch (error: any) {
        console.error("暂停提现失败:", error);
        if (
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.code === 4001
        ) {
          toast.info("用户取消了操作");
        } else {
          toast.error("暂停提现失败: " + (error.message || "未知错误"));
        }
      } finally {
        setIsPausingWithdraw(false);
      }
    };

    // 恢复提现
    const handleUnpauseWithdraw = async () => {
      if (!writeContractStake || !canWriteStake || !walletClient) {
        toast.error("钱包未连接或合约实例未准备好");
        return;
      }

      try {
        setIsUnpausingWithdraw(true);
        const tx = await writeContractStake.write.unpauseWithdraw();
        const res = await waitForTransactionReceipt(walletClient, { hash: tx });

        if (res.status === "success") {
          toast.success("恢复提现成功！");
          getPauseStatus();
          // 刷新页面以更新所有池子状态
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error("恢复提现失败！");
        }
      } catch (error: any) {
        console.error("恢复提现失败:", error);
        if (
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied") ||
          error.code === 4001
        ) {
          toast.info("用户取消了操作");
        } else {
          toast.error("恢复提现失败: " + (error.message || "未知错误"));
        }
      } finally {
        setIsUnpausingWithdraw(false);
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 领取功能控制 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`rounded-xl p-4 border ${
            claimPaused
              ? backgroundStyles.accent.red + " " + borderStyles.accent.red
              : backgroundStyles.accent.green + " " + borderStyles.accent.green
          }`}
        >
          <div className="text-center space-y-3">
            <div>
              <p
                className={`text-xs font-medium mb-1 ${
                  claimPaused
                    ? "text-red-600 dark:text-red-300"
                    : "text-green-600 dark:text-green-300"
                }`}
              >
                领取功能状态
              </p>
              <p
                className={`text-lg font-bold ${
                  claimPaused
                    ? "text-red-900 dark:text-red-100"
                    : "text-green-900 dark:text-green-100"
                }`}
              >
                {claimPaused ? "已暂停" : "正常运行"}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={claimPaused ? handleUnpauseClaim : handlePauseClaim}
              disabled={!isConnected || isPausingClaim || isUnpausingClaim}
              className={`${getButtonClasses(
                claimPaused ? "success" : "warning"
              )} w-full text-sm px-3 py-2`}
            >
              {(isPausingClaim || isUnpausingClaim) && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
              )}
              {isPausingClaim
                ? "暂停中..."
                : isUnpausingClaim
                ? "恢复中..."
                : claimPaused
                ? "恢复领取功能"
                : "暂停领取功能"}
            </motion.button>
          </div>
        </motion.div>

        {/* 提现功能控制 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`rounded-xl p-4 border ${
            withdrawPaused
              ? backgroundStyles.accent.red + " " + borderStyles.accent.red
              : backgroundStyles.accent.green + " " + borderStyles.accent.green
          }`}
        >
          <div className="text-center space-y-3">
            <div>
              <p
                className={`text-xs font-medium mb-1 ${
                  withdrawPaused
                    ? "text-red-600 dark:text-red-300"
                    : "text-green-600 dark:text-green-300"
                }`}
              >
                提现功能状态
              </p>
              <p
                className={`text-lg font-bold ${
                  withdrawPaused
                    ? "text-red-900 dark:text-red-100"
                    : "text-green-900 dark:text-green-100"
                }`}
              >
                {withdrawPaused ? "已暂停" : "正常运行"}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={
                withdrawPaused ? handleUnpauseWithdraw : handlePauseWithdraw
              }
              disabled={
                !isConnected || isPausingWithdraw || isUnpausingWithdraw
              }
              className={`${getButtonClasses(
                withdrawPaused ? "success" : "warning"
              )} w-full text-sm px-3 py-2`}
            >
              {(isPausingWithdraw || isUnpausingWithdraw) && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
              )}
              {isPausingWithdraw
                ? "暂停中..."
                : isUnpausingWithdraw
                ? "恢复中..."
                : withdrawPaused
                ? "恢复提现功能"
                : "暂停提现功能"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* 页面标题 */}
        <motion.div variants={itemVariants}>
          <div className={`text-2xl font-bold ${textStyles.heading} mb-2`}>
            池子管理
          </div>
          <p className={`${textStyles.muted}`}>
            管理质押池，包括添加新池子、暂停和恢复池子功能
          </p>
        </motion.div>

        {/* 网络和合约信息卡片 */}
        <motion.div variants={itemVariants} className={getCardClasses()}>
          <div className={`px-6 py-4 border-b ${borderStyles.default}`}>
            <h2 className={`text-xl font-semibold ${textStyles.heading}`}>
              网络和合约信息
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 当前网络 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-4 border ${backgroundStyles.accent.blue} ${borderStyles.accent.blue}`}
              >
                <div className="text-center">
                  <p className="text-xs font-medium mb-1 text-blue-600 dark:text-blue-300">
                    当前网络
                  </p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {chainId ? getNetworkName(chainId) : "未连接"}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Chain ID: {chainId || "N/A"}
                  </p>
                </div>
              </motion.div>

              {/* 池子总数 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-4 border ${backgroundStyles.accent.green} ${borderStyles.accent.green}`}
              >
                <div className="text-center">
                  <p className="text-xs font-medium mb-1 text-emerald-600 dark:text-emerald-300">
                    池子总数
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {poolLength}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    个活跃池子
                  </p>
                </div>
              </motion.div>

              {/* 合约地址 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-4 border ${backgroundStyles.accent.purple} ${borderStyles.accent.purple}`}
              >
                <div className="text-center">
                  <p className="text-xs font-medium mb-1 text-purple-600 dark:text-purple-300">
                    质押合约地址
                  </p>
                  <p className="text-sm font-mono font-bold text-purple-900 dark:text-purple-100 break-all">
                    {MetaNodeStakeAddress.slice(0, 6)}...
                    {MetaNodeStakeAddress.slice(-4)}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(MetaNodeStakeAddress);
                      toast.success("地址已复制到剪贴板");
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-1"
                  >
                    点击复制完整地址
                  </button>
                </div>
              </motion.div>
            </div>

            {/* 全局控制按钮 */}
            <div className="mt-6">
              <h3
                className={`text-lg font-semibold ${textStyles.heading} mb-4`}
              >
                全局功能控制
              </h3>
              <GlobalPauseControls />
            </div>

            {/* 添加池子按钮和表单 */}
            <div className="mt-6 space-y-4">
              {!showAddPoolForm ? (
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddPoolForm(true)}
                    disabled={!isConnected}
                    className={`${getButtonClasses("primary")} px-8 py-3`}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    添加新池子
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                >
                  <h3 className={`text-lg font-semibold ${textStyles.heading}`}>
                    添加新池子
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${textStyles.muted} mb-1`}
                      >
                        代币合约地址*
                      </label>
                      <input
                        type="text"
                        value={newPoolAddress}
                        onChange={(e) => setNewPoolAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${textStyles.muted} mb-1`}
                      >
                        池子权重
                      </label>
                      <input
                        type="number"
                        value={newPoolWeight}
                        onChange={(e) => setNewPoolWeight(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${textStyles.muted} mb-1`}
                      >
                        最小质押金额 (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={newMinDeposit}
                        onChange={(e) => setNewMinDeposit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${textStyles.muted} mb-1`}
                      >
                        解锁区块数
                      </label>
                      <input
                        type="number"
                        value={newUnlockBlocks}
                        onChange={(e) => setNewUnlockBlocks(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddPoolForm(false)}
                      className={getButtonClasses("secondary")}
                    >
                      取消
                    </button>
                    <button
                      onClick={addPool}
                      disabled={!isConnected}
                      className={getButtonClasses("primary")}
                    >
                      确认添加
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 池子列表 */}
        <motion.div variants={itemVariants}>
          <div className={`text-2xl font-semibold ${textStyles.heading} mb-2`}>
            池子列表
          </div>
          {poolIds.length > 0 ? (
            <motion.div variants={containerVariants} className="grid gap-6">
              {poolIds.map((pid) => (
                <motion.div
                  key={pid}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <ManagePool pid={pid} refetchPoolLength={refetchPoolLength} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              className={`${getCardClasses()} text-center py-12`}
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3
                className={`text-lg font-semibold ${textStyles.heading} mb-2`}
              >
                暂无池子
              </h3>
              <p className={`${textStyles.muted} mb-4`}>
                还没有创建任何质押池，点击上方按钮添加第一个池子
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Page;
