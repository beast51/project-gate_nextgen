export type GateUserType = {
  id?: string,
  idInApi: string;
  name: string;
  phoneNumber: string;
  carNumber: string[];
  apartmentNumber: string;
  isBlackListed: boolean;
  blackListedFrom?: string,
  blackListedTo?: string,
  image?: string,
  additionalImages?: string[]
}

export type GateUserCardProps = {
  data: GateUserType;
  // searchResult?: GateUserType[];
  // setSearchResult?: Dispatch<SetStateAction<GateUserType[]>>;
  // updateUsersList?: (phoneNumber: string) => void;
}

export type GateUserCardsListType = {
  users: GateUserType[]
}