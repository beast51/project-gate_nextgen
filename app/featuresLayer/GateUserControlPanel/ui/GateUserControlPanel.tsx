'use client';
import { Button } from '@/sharedLayer/ui/Button';
import { FC, useState } from 'react';
import classes from './GateUserControlPanel.module.scss';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import axios from 'axios';
import toast from 'react-hot-toast';
import Popup from '@/sharedLayer/ui/Popup/ui/Popup';
import { useRouter } from 'next/navigation';

export type GateUserControlPanelPropsType = {
  user: GateUserType;
};

export type ActionType = 'delete' | 'block' | 'unblock' | 'edit' | null;

export const GateUserControlPanel: FC<GateUserControlPanelPropsType> = ({
  user,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [action, setAction] = useState<ActionType>(null);
  const router = useRouter();

  const handleOpen = (actionType: ActionType) => {
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
      .catch(() => toast.error('Something went wrong'))
      .finally(() => {
        setIsLoading(false);
        // setIsOpenPopup(false);
      });
  };

  const confirmAction = (action: ActionType) => {
    if (action === 'delete') {
      deleteUserHandler(user.phoneNumber, user.idInApi);
    }
    // if (action === 'block' || 'unblock)') changeStatusHandler(data);
    // if (action === 'edit') editUserHandler(data);
  };

  return (
    <>
      <div className={classes.wrapper}>
        <Button>Заблокировать</Button>
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
