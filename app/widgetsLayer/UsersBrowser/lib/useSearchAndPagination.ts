import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';

export const useSearchAndPagination = (initialData: GateUserType[], itemsPerPage: number) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(initialData);

  const paginatedData = useMemo(() => {
    return searchResult.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage,
    );
  }, [searchResult, page]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const handleSearchInput = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const currentValue = event.target.value;
    setSearchQuery(currentValue);
    setPage(1);
    
    const result = initialData.filter(
      (user) =>
        user.name?.toLowerCase().includes(currentValue.toLowerCase()) ||
        Boolean(
          user.carNumber?.filter((number) =>
            number.toLowerCase().includes(currentValue.toLowerCase()),
          ).length,
        ) ||
        user.phoneNumber?.toLowerCase().includes(currentValue.toLowerCase()) ||
        user.apartmentNumber
          ?.toLowerCase()
          .includes(currentValue.toLowerCase()),
    );

    setSearchResult(result);
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