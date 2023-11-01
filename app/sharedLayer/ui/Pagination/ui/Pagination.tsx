import React, { FC } from 'react';
import { PaginationProps } from '../Pagination.type';
import { Pagination as MuiPagination } from '@mui/material';
import classes from './Pagination.module.scss';

export const Pagination: FC<PaginationProps> = ({
  paginatedDataLength,
  itemsPerPage,
  count,
  page,
  error,
  onChange,
}) => {
  console.log(paginatedDataLength);
  const isVisiblePagination =
    paginatedDataLength < itemsPerPage && paginatedDataLength > 0;
  return (
    !isVisiblePagination && (
      <div className={classes.pagination}>
        {paginatedDataLength > 0 ? (
          <MuiPagination count={count} page={page} onChange={onChange} />
        ) : (
          <div>{error}</div>
        )}
      </div>
    )
  );
};
