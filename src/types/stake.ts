// 质押池信息类型
export interface PoolInfo {
  stTokenAddress: `0x${string}`;
  poolWeight: bigint;
  lastRewardBlock: bigint;
  accMetaNodePerST: bigint;
  stTokenAmount: bigint;
  minDepositAmount: bigint;
  unstakeLockedBlocks: bigint;
}

export type IRequest = {
  amount: bigint;
  unlockBlocks: bigint;
};
// 用户信息类型
export interface UserInfo {
  stAmount: bigint;
  finishedMetaNode: bigint;
  pendingMetaNode: bigint;
  requests: IRequest[];
}

// 提现金额类型
export interface WithdrawAmount {
  requestAmount: bigint;
  pendingWithdrawAmount: bigint;
}
