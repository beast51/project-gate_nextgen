'use client';

import classes from './GateUserCardsList.module.scss';
import { GateUserCard } from '@/entitiesLayer/GateUserCard';
import { FC, useEffect, useState } from 'react';
import { GateUserType } from '@/entitiesLayer/GateUserCard/GateUserCard.type';
import { GateUserCardsListType } from '../GateUserCards.type';
import { Pagination } from '@/sharedLayer/ui/Pagination';
import { useIntl } from 'react-intl';

const ITEMS_PER_PAGE = 50;

export const GateUserCardsList: FC<GateUserCardsListType> = ({ users }) => {
  const { $t } = useIntl();
  const [searchResult, setSearchResult] = useState<GateUserType[]>(users);
  const [page, setPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState(
    searchResult.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
  );

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  useEffect(() => {
    setPaginatedData(
      searchResult.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    );
  }, [searchResult, page]);

  return (
    <>
      <div className={classes.gateUserCardList}>
        {paginatedData.map((user) => {
          return <GateUserCard data={user} key={user.phoneNumber} />;
        })}
      </div>
      <div className=" w-full flex justify-center py-5">
        {paginatedData.length > 0 ? (
          <Pagination
            count={Math.ceil(searchResult.length / ITEMS_PER_PAGE)}
            page={page}
            onChange={handleChange}
          />
        ) : (
          <div>{$t({ id: 'Unfortunately, there are no results...' })}</div>
        )}
      </div>
    </>
  );
};
