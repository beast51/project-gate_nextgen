'use client';
import { GateUserCardsList } from '@/entitiesLayer/GateUserCardsList/ui/GateUserCardsList';
import { Button } from '@/sharedLayer/ui/Button';
import { Pagination } from '@/sharedLayer/ui/Pagination';
// import { TextField } from '@mui/material';
import { FC } from 'react';
import { FaUserPlus } from 'react-icons/fa6';
import { useIntl } from 'react-intl';
import { UserBrowserType } from '../UserBrowser.type';
import { useSearchAndPagination } from '../lib/useSearchAndPagination';
import { Input } from '@/sharedLayer/ui/Input';
import { TextField } from '@mui/material';

const ITEMS_PER_PAGE = 50;

export const UserBrowser: FC<UserBrowserType> = ({ users }) => {
  const { $t } = useIntl();
  const {
    page,
    searchQuery,
    paginatedData,
    searchResult,
    handlePageChange,
    handleSearchInput,
  } = useSearchAndPagination(users, ITEMS_PER_PAGE);

  return (
    <>
      <div className="flex fixed top-0 left-0 z-10 bg-white w-full p-5 bg">
        {/* <Input
          label="Search"
          id="outlined-size-small"
          value={searchQuery}
          // size="small"
          // fullWidth
          onChange={handleSearchInput}
          // className="flex-grow"
        /> */}
        <TextField
          label="Search"
          id="outlined-size-small"
          value={searchQuery}
          size="small"
          fullWidth
          onChange={handleSearchInput}
          className="flex-grow"
        />
        <Button className="w-20 ml-2">
          <FaUserPlus className="w-6 h-6" />
        </Button>
      </div>
      <GateUserCardsList users={paginatedData} />;
      <div className=" w-full flex justify-center py-5">
        {paginatedData.length > 0 ? (
          <Pagination
            count={Math.ceil(searchResult.length / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
          />
        ) : (
          <div>{$t({ id: 'Unfortunately, there are no results...' })}</div>
        )}
      </div>
    </>
  );
};
