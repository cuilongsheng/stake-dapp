import { Abi } from "viem";
import { useReadContract as useReadContractBase } from "wagmi";

export interface IUseReadContract {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  // @ts-ignore
  args?: any;
}

// 自定义 Hook，增加类型处理功能
export function useReadContract<T>(config: IUseReadContract) {
  const result = useReadContractBase(config);
  return {
    ...result,
    safeData: result.data as T | undefined,
  };
}
