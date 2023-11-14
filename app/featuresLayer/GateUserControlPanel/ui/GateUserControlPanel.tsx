'use client';
import { Button } from '@/sharedLayer/ui/Button';
import { FC, useCallback, useState } from 'react';
import classes from './GateUserControlPanel.module.scss';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import axios from 'axios';
import toast from 'react-hot-toast';
import Popup from '@/sharedLayer/ui/Popup/ui/Popup';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/sharedLayer/utils/date';
import { BlockButtons } from './BlockButtons/BlockButtons';
import { ConfirmButtons } from './ConfirmButtons/ConfirmButtons';
import {
  ActionType,
  GateUserControlPanelPropsType,
} from '../GateUserControlPanel.type';
import { useIntl } from 'react-intl';

const getTimestampInDays = (days: number) => {
  const now = Date.now();
  const inOneWeek = now + days * 24 * 60 * 60 * 1000;
  let futureDate = new Date(inOneWeek);
  futureDate.setHours(23, 50, 0, 0);
  return futureDate.getTime();
};

const ONE_WEEK = 7;

export const GateUserControlPanel: FC<GateUserControlPanelPropsType> = ({
  user,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [action, setAction] = useState<ActionType>(null);
  const router = useRouter();
  const { $t } = useIntl();

  const handleOpen = (actionType: ActionType) => {
    console.log('click');
    setAction(actionType);
    setIsOpenPopup(true);
  };
  const handleClose = useCallback(() => {
    setIsOpenPopup(false);
  }, [setIsOpenPopup]);

  const deleteUserHandler = (phoneNumber: string, id: string) => {
    setIsLoading(true);
    axios
      .post(
        '/api/users/delete_user',
        { phoneNumber, id },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then(() => {
        console.log('data', phoneNumber);
        router.push('/users');
        router.refresh();
      })
      .catch(() => {
        toast.error('Something went wrong');
        setIsOpenPopup(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const changeStatusHandler = async (data: GateUserType, days: number) => {
    // console.log(action + '' + phoneNumber);
    setIsLoading(true);

    // console.log(data);
    // setIsLoading(false);
    axios
      .post(
        '/api/users/edit_user',
        {
          ...data,
          blackListedFrom: user.isBlackListed
            ? user.blackListedFrom
            : formatTime(Date.now(), false),
          blackListedTo: user.isBlackListed
            ? user.blackListedTo
            : formatTime(getTimestampInDays(days), false),
          isBlackListed: !user.isBlackListed,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then(() => {
        console.log('data changed');
        router.refresh();
      })
      .catch(() => toast.error('Something went wrong'))
      .finally(() => {
        setIsLoading(false);
        setIsOpenPopup(false);
      });
  };

  const confirmAction = useCallback(
    (action: ActionType, time = ONE_WEEK) => {
      if (action === 'delete') {
        deleteUserHandler(user.phoneNumber, user.idInApi);
      }
      if (action === 'block' || 'unblock)') changeStatusHandler(user, time);
      // if (action === 'edit') editUserHandler(data);
    },
    [deleteUserHandler, user.phoneNumber, user.idInApi, changeStatusHandler],
  );

  return (
    <>
      <div className={classes.wrapper}>
        <Button
          onClick={() => handleOpen(user.isBlackListed ? 'unblock' : 'block')}
          variant={user.isBlackListed ? 'primary' : 'warning'}
        >
          {$t({ id: user.isBlackListed ? 'unblock' : 'block' })}
        </Button>
        <Button>{$t({ id: 'edit' })}</Button>
        <Button onClick={() => handleOpen('delete')} variant="warning">
          {$t({ id: 'delete' })}
        </Button>
      </div>
      <Popup
        onClose={handleClose}
        isOpen={isOpenPopup}
        className={classes.popup}
        // className="flex flex-col w-3/4 h-32 max-w-xs justify-between items-center p-5"
      >
        {action === 'edit' ? (
          <>Редактирование</>
        ) : (
          <>
            {user.isBlackListed ? (
              <ConfirmButtons
                confirmAction={confirmAction}
                handleClose={handleClose}
                action={action}
                isLoading={isLoading}
              />
            ) : (
              <BlockButtons
                confirmAction={confirmAction}
                handleClose={handleClose}
                action={action}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </Popup>
    </>
  );
};
