import { CallDto } from "@/contracts";

export type CallType = CallDto

export type CallsType = CallType[]

export type CallsCardPropsType = {
  call: CallType;
  onDoubleClick: (phoneNumber: string) => void
};
