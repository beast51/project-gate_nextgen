import React, { FC } from 'react';
import { PaginationProps } from '../Pagination.type';
import { Pagination as MuiPagination } from '@mui/material';

export const Pagination: FC<PaginationProps> = ({ count, page, onChange }) => {
  return <MuiPagination count={count} page={page} onChange={onChange} />;
};
