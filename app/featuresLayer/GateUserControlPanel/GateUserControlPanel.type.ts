import { GateUserType } from "@/entitiesLayer/GateUser/model/types/GateUser.type";

export type GateUserControlPanelPropsType = {
  user: GateUserType;
};

export type ActionType = 'delete' | 'block' | 'unblock' | 'edit' | null;