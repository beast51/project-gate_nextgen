import { Call } from "@/core/entities/call";

export type CallType = Call

export type CallsType = CallType[]

export type CallsCardPropsType = {
  call: CallType;
  onDoubleClick: (phoneNumber: string) => void
};
