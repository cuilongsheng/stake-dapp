"use client";
import { useEffect, useMemo, useState } from "react";
import { erc20ABI, getERC20Address } from "@/contracts/erc20";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { useContractInstance } from "@/hooks/useContractInstance";
import {
  MetaNodeStakeAbi,
  MetaNodeStakeAddress,
} from "@/contracts/metaNodeStake";
import { Button } from "@mui/material";
import { toast } from "react-toastify";
import { waitForTransactionReceipt } from "viem/actions";

function Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [totalSupply, setTotalSupply] = useState<string | null>(null);
  const [poolLength, setPoolLength] = useState<number>(0);
  const erc20TokenAddress = useMemo(() => {
    return chainId ? getERC20Address(chainId) : null;
  }, [chainId]);

  // 合约信息状态
  const { readContract, canRead } = useContractInstance(
    erc20TokenAddress as `0x${string}`,
    erc20ABI
  );
  const getERC20TokenInfo = async () => {
    if (!readContract || !canRead) {
      return;
    }
    try {
      const _totalSupply = await readContract.read.balanceOf([address]);
      setTotalSupply(_totalSupply?.toString() || null);
    } catch (totalSupplyError) {
      console.warn("无法获取总供应量:", totalSupplyError);
    }
  };
  useEffect(() => {
    if (isConnected) {
      getERC20TokenInfo();
    }
  }, [isConnected]);
  const {
    readContract: readContractStake,
    writeContract: writeContractStake,
    canRead: canReadStake,
    canWrite: canWriteStake,
  } = useContractInstance(
    MetaNodeStakeAddress as `0x${string}`,
    MetaNodeStakeAbi
  );
  const getMetaNodeStakeInfo = async () => {
    if (!readContractStake || !canReadStake) {
      return;
    }
    // 查询质押合约信息,pool信息
    const _poolLength = await readContractStake.read.poolLength();
    setPoolLength(Number((_poolLength as bigint) || 0));
  };
  useEffect(() => {
    if (isConnected) {
      getMetaNodeStakeInfo();
    }
  }, [isConnected]);
  // 添加池子
  const addPool = async () => {
    if (!writeContractStake || !canWriteStake || !walletClient) {
      toast.error("钱包未连接或合约实例未准备好");
      return;
    }
    if (poolLength > 0) {
      return toast.error("当前质押池不支持添加第二个池子");
    }

    try {
      const pid = poolLength === 0 ? 0 : poolLength + 1;
      const _add =
        pid > 0
          ? "0x0000000000000000000000000000000000000000"
          : "0x0000000000000000000000000000000000000000";

      // 使用writeContract进行写入操作
      const tx = await writeContractStake.write.addPool([
        _add,
        100,
        1000000000000000, // 0.001 ETH in wei
        10,
        false,
      ]);

      const res = await waitForTransactionReceipt(walletClient, { hash: tx });
      if (res.status === "success") {
        toast.success("池子添加成功！交易哈希: " + tx);
      } else {
        toast.error("池子添加失败！交易哈希: " + tx);
      }

      // 重新获取池子信息
      setTimeout(() => {
        getMetaNodeStakeInfo();
      }, 2000);
    } catch (error: any) {
      console.error("添加池子失败:", error);
      toast.error("添加池子失败: " + (error.message || "未知错误"));
    }
  };
  const pausePool = async () => {
    if (!writeContractStake || !canWriteStake || !walletClient) {
      toast.error("钱包未连接或合约实例未准备好");
      return;
    }
    const tx = await writeContractStake.write.pauseClaim();
    const res = await waitForTransactionReceipt(walletClient, { hash: tx });
    if (res.status === "success") {
      toast.success("池子暂停领取奖励！交易哈希: " + tx);
    } else {
      toast.error("池子暂停领取奖励失败！交易哈希: " + tx);
    }
  };
  // TODO 管理员还可以做暂停和恢复的操作,这里就不写了,多写几个write和waitForTransactionReceipt; 电脑太卡,没2小时搞不定
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* 合约信息 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">MetaNode 代币合约信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p>
            <strong>合约地址:</strong>{" "}
            <span className="font-mono text-sm">{erc20TokenAddress}</span>
          </p>
          <p>
            <strong>总供应量:</strong>{" "}
            {totalSupply
              ? `${(
                  Number(totalSupply) / Math.pow(10, 18)
                ).toLocaleString()} ${"代币"}`
              : "未获取"}
          </p>
        </div>
      </div>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">MetaNode 质押合约信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p>
            <strong>合约地址:</strong>{" "}
            <span className="font-mono text-sm">
              {MetaNodeStakeAddress || "未配置"}
            </span>
          </p>
          <p>
            <strong>池子数量:</strong>{" "}
            <span className="font-mono text-sm">{poolLength || "未配置"}</span>
          </p>
          <Button
            variant="contained"
            onClick={addPool}
            disabled={!canWriteStake || !isConnected || poolLength > 0}
          >
            {!isConnected
              ? "请先连接钱包"
              : poolLength > 0
              ? "已有池子"
              : "添加池子"}
          </Button>
        </div>
        <Button variant="contained" onClick={pausePool}>
          暂停
        </Button>
      </div>
    </div>
  );
}

export default Page;
