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
  const isVisiblePagination =
    paginatedDataLength === itemsPerPage ||
    (paginatedDataLength !== itemsPerPage && page > 1);
  const isVisibleError = paginatedDataLength === 0;

  return (
    <div className={classes.pagination}>
      {isVisiblePagination && (
        <MuiPagination count={count} page={page} onChange={onChange} />
      )}
      {isVisibleError && <div>{error}</div>}
    </div>
  );
};
