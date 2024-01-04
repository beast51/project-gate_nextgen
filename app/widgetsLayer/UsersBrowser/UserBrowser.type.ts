import { GateUserType } from "@/entitiesLayer/GateUser/model/types/GateUser.type";

export type UserBrowserType = {
  users: GateUserType[];
  isSpectator?: boolean
};