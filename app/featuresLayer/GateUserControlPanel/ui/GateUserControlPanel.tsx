'use client';
import { Button } from '@/sharedLayer/ui/Button';
import { FC, useState } from 'react';
import classes from './GateUserControlPanel.module.scss';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import axios from 'axios';
import toast from 'react-hot-toast';
import Popup from '@/sharedLayer/ui/Popup/ui/Popup';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/sharedLayer/utils/date';

export type GateUserControlPanelPropsType = {
  user: GateUserType;
};

export type ActionType = 'delete' | 'block' | 'unblock' | 'edit' | null;

const DATE_AND_TIME_NOW = formatTime(Date.now(), false);

const getTimestampForOneWeekViolation = () => {
  const now = Date.now();
  const inOneWeek = now + 7 * 24 * 60 * 60 * 1000;
  let futureDate = new Date(inOneWeek);
  futureDate.setHours(23, 50, 0, 0);
  return futureDate.getTime();
};

const DATE_AND_TIME_ONE_WEEK_VIOLATION = formatTime(
  getTimestampForOneWeekViolation(),
  false,
);

export const GateUserControlPanel: FC<GateUserControlPanelPropsType> = ({
  user,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [action, setAction] = useState<ActionType>(null);
  const router = useRouter();

  const handleOpen = (actionType: ActionType) => {
    console.log('click');
    setAction(actionType);
    setIsOpenPopup(true);
  };
  const handleClose = () => setIsOpenPopup(false);

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

  const changeStatusHandler = async (data: GateUserType) => {
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
            : DATE_AND_TIME_NOW,
          blackListedTo: user.isBlackListed
            ? user.blackListedTo
            : DATE_AND_TIME_ONE_WEEK_VIOLATION,
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

  const confirmAction = (action: ActionType) => {
    if (action === 'delete') {
      deleteUserHandler(user.phoneNumber, user.idInApi);
    }
    if (action === 'block' || 'unblock)') changeStatusHandler(user);
    // if (action === 'edit') editUserHandler(data);
  };

  return (
    <>
      <div className={classes.wrapper}>
        <Button
          onClick={() => handleOpen(user.isBlackListed ? 'unblock' : 'block')}
        >
          {user.isBlackListed ? 'Разблокировать' : 'Заблокировать'}
        </Button>
        <Button>Редактировать</Button>
        <Button onClick={() => handleOpen('delete')}>Удалить</Button>
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
            <div>Are you sure?</div>
            <div className="flex justify-center items-center">
              <Button onClick={() => confirmAction(action)} className="w-20">
                Yes
              </Button>
              <Button onClick={handleClose} className="w-20 ml-5">
                No
              </Button>
            </div>
          </>
        )}
      </Popup>
    </>
  );
};
