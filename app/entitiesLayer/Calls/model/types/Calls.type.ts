export type CallType = {
  number: string;
  time: string;
  callerName: string;
  image?: string;
  carNumber?: string[];
  apartmentNumber?: string;
  isBlackListed: boolean;
  blackListedFrom: string;
  blackListedTo: string;
};

export type CallsCardPropsType = {
  call: CallType;
};