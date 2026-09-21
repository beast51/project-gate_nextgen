import { useEffect, useMemo, useState } from "react";
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import { matchesSearch, SearchMode } from '@/sharedLayer/lib/search';

// search by everything (name, car number, phone number, apartment) or by one of them
export const filterGateUsers = (users: GateUserType[], searchQuery: string, mode: SearchMode = 'all') =>
  searchQuery.trim()
    ? users.filter((user) => matchesSearch({
      phones: [user.phoneNumber],
      apartment: user.apartmentNumber,
      cars: user.carNumber,
      name: user.name,
    }, searchQuery, mode))
    : users;

export const useSearchAndPagination = (
  data: GateUserType[],
  itemsPerPage: number,
  searchQuery: string,
  mode: SearchMode,
) => {
  const [page, setPage] = useState(1);

  // derived from the data: a refreshed list shows up without remounting the component
  const searchResult = useMemo(() => filterGateUsers(data, searchQuery, mode), [data, searchQuery, mode]);

  // another search is another list: it starts from its first page
  useEffect(() => setPage(1), [searchQuery, mode]);

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

  return {
    page,
    paginatedData,
    searchResult,
    handlePageChange,
  };
};
