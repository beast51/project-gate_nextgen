import React, { FC, memo } from 'react';
import { ConfirmButtonsPropsType } from './ConfirmButtons.type';
import { Button } from '@/sharedLayer/ui/Button';
import classes from './ConfirmButtons.module.scss';
import { useIntl } from 'react-intl';

export const ConfirmButtons: FC<ConfirmButtonsPropsType> = memo(
  ({ confirmAction, handleClose, isLoading, action, title }) => {
    const { $t } = useIntl();
    return (
      <div className={classes.container}>
        <div>{title}</div>
        <div className={classes.wrapper}>
          <Button
            onClick={() => confirmAction(action)}
            disabled={isLoading}
            fullWidth
          >
            {$t({ id: 'yes' })}
          </Button>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            variant="warning"
            fullWidth
          >
            {$t({ id: 'no' })}
          </Button>
        </div>
      </div>
    );
  },
);
