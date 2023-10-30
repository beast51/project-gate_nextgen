import { Dispatch, SetStateAction } from "react";

export type GateUserType = {
  id?: string,
  idInApi: string;
  name?: string;
  phoneNumber: string;
  carNumber?: string[];
  apartmentNumber?: string;
  isBlackListed?: boolean;
  blackListedFrom?: string,
  blackListedTo?: string,
  image?: string
}

export type GateUserCardProps = {
  data: GateUserType;
  // searchResult?: GateUserType[];
  // setSearchResult?: Dispatch<SetStateAction<GateUserType[]>>;
  // updateUsersList?: (phoneNumber: string) => void;
}