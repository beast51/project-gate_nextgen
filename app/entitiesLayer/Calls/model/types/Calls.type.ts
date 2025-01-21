import { GateUserType } from "@/entitiesLayer/GateUser/model/types/GateUser.type";
import { callState, causeAllowList, causeDisallowList } from "../providers/unitalkCallsProvider";

export type CallsApiProvider = {
  getCallsFromApi: (from: string, to: string) => Promise<SerializedCall[]>;
}
export type CallStateType = typeof callState
export type CallStateValues = CallStateType[keyof CallStateType];
export type CauseType = typeof causeDisallowList & typeof causeAllowList
export type CauseDisallowListKeys = keyof typeof causeDisallowList;
export type CauseAllowListKeys = keyof typeof causeAllowList;

export type CauseKeys = CauseDisallowListKeys | CauseAllowListKeys;
export type CauseNumbers = Extract<CauseKeys, string> extends infer T ? T extends string ? number : never : never;

export type CallFromApiType = {
  outerNumber: string,
  utmSource: string | null,
  utmMedium: string | null,
  utmCampaign: string | null,
  utmTerm: string | null,
  utmContent: string | null,
  googleId: string | null,
  facebookClientId: string | null,
  gclid: string | null,
  cdid: string | null,
  referer: string | null,
  ip: string | null,
  lastUrl: string | null,
  meta: string | null,
  id: number,
  dbid: number,
  from: string,
  to: string[],
  lastGroupName: string | null,
  direction: string,
  secondsFullTime: number,
  secondsTalk: number,
  callback: boolean,
  date: string,
  state: CallStateValues,
  link: string | null,
  source: string,
  cause: CauseNumbers,
  comment: string | null,
  hasSeparateRecords: boolean
}

export type CallFromApiDataType = {
  count: number
  calls: CallFromApiType[]
  warning: string | null
}

export type SerializedCall = {
  number: string
  time: string
  secondsFullTime?: number,
  cause?: CauseNumbers | null,
  state?: CallStateValues | null
}

export type CallsCardPropsType = {
  call: CallType;
  onDoubleClick: (phoneNumber: string) => void
};

// export type getInfoFromDatabaseByPhoneNumberType = {
//   id: string
//   name: string | null
//   carNumber: string[]
//   apartmentNumber: string | null
//   image: string | null
//   isBlackListed: boolean | null
//   blackListedFrom: string | null
//   blackListedTo: string | null
// } | null
export type getInfoFromDatabaseByPhoneNumberType = Omit<GateUserType, 'phoneNumber' | 'idInApi'> | null


export type CallType = {
  number: string
  time: string
  carNumber: string[]
  callerName: string | null
  apartmentNumber: string | null
  image: string | null
  isBlackListed?: boolean | null
  blackListedFrom: string | null
  blackListedTo: string | null
  secondsFullTime: number | null
  cause: number | null
  state: string | null
}

export type CallsType = CallType[]

export type CallsDatabaseProvider = {
  isTimeToUpdateCalls: () => Promise<boolean>
  updateCallsData: (from: string, to: string) => Promise<void>
  getCallsByTimeRangeWithoutBlockedAndWithCause: (from: string, to: string) => Promise<CallsType>
  getCallsFromDatabaseByTimeRange: (from: string, to: string) => Promise<CallsType>
}

