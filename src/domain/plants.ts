import type { PlantCode } from "./types";

export const PLANT_ORDER: PlantCode[] = ["K1", "K2", "K3"];

export const PLANT_LABEL: Record<PlantCode, string> = {
  K1: "K1 · 1공장",
  K2: "K2 · 2공장",
  K3: "K3 · 3공장",
};

export const PLANT_DESC: Record<PlantCode, string> = {
  K1: "조리냉동 · 조미HMI",
  K2: "즉석밥 · FD",
  K3: "유탕면 · 건면",
};

/** 단위는 공장 안에서만 의미가 있다. 공장 간 물량·단가 합산 금지. */
export const UNITS: Record<PlantCode, { qty: string; cost: string; prod: string }> = {
  K1: { qty: "kg", cost: "원/kg", prod: "kg/MH" },
  K2: { qty: "식", cost: "원/식", prod: "식/MH" },
  K3: { qty: "식", cost: "원/식", prod: "식/MH" },
};

export const isPlant = (v: string): v is PlantCode => (PLANT_ORDER as string[]).includes(v);
