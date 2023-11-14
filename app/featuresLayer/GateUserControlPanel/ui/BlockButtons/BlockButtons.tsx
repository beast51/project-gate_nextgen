import React, { FC, memo } from 'react';
import { BlockButtonsPropsType } from './BlockButtons.type';
import { Button } from '@/sharedLayer/ui/Button';
import classes from './BlockButtons.module.scss';
import cn from 'classnames';
import { useIntl } from 'react-intl';

const ONE_WEEK = 7;
const TWO_WEEK = 14;

export const BlockButtons: FC<BlockButtonsPropsType> = memo(
  ({ confirmAction, handleClose, isLoading, action }) => {
    const { $t } = useIntl();
    return (
      <div className={classes.container}>
        <p>{$t({ id: 'block a user for:' })}</p>
        <div className={cn(classes.wrapper, 'full-width')}>
          <Button
            onClick={() => confirmAction(action, ONE_WEEK)}
            disabled={isLoading}
            fullWidth
            variant="warning"
          >
            {$t({ id: '1 week' })}
          </Button>
          <Button
            onClick={() => confirmAction(action, TWO_WEEK)}
            disabled={isLoading}
            fullWidth
            variant="warning"
          >
            {$t({ id: '2 week' })}
          </Button>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
            className="w-20 ml-5"
          >
            {$t({ id: 'cancel' })}
          </Button>
        </div>
      </div>
    );
  },
);
