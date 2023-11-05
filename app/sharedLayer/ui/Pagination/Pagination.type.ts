import { GateUserType } from "@/entitiesLayer/GateUser/model/types/GateUser.type";

export type PaginationProps = {
  paginatedDataLength: number 
  itemsPerPage: number
  count: number;
  page: number;
  error: string
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
};