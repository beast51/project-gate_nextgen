import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';

// search by name, car number, phone number and apartment
export const filterGateUsers = (users: GateUserType[], searchQuery: string) => {
  const query = searchQuery.toLowerCase();

  if (!query) return users;

  return users.filter(
    (user) =>
      user.name?.toLowerCase().includes(query) ||
      Boolean(user.carNumber?.filter((number) => number.toLowerCase().includes(query)).length) ||
      user.phoneNumber?.toLowerCase().includes(query) ||
      user.apartmentNumber?.toLowerCase().includes(query),
  );
};

export const useSearchAndPagination = (data: GateUserType[], itemsPerPage: number) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // derived from the data: a refreshed list shows up without remounting the component
  const searchResult = useMemo(() => filterGateUsers(data, searchQuery), [data, searchQuery]);

  const paginatedData = useMemo(() => {
    return searchResult?.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage,
    );
  }, [searchResult, page, itemsPerPage]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const handleSearchInput = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  return {
    page,
    searchQuery,
    paginatedData,
    searchResult,
    handlePageChange,
    handleSearchInput,
  };
};