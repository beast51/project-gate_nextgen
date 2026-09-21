'use client';
import { Button } from '@/sharedLayer/ui/Button';
import { FC, useCallback, useState } from 'react';
import classes from './GateUserControlPanel.module.scss';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import { api, useGateUsersCache } from '@/sharedLayer/api';
import toast from 'react-hot-toast';
import Popup from '@/sharedLayer/ui/Popup/ui/Popup';
import { useRouter } from '@/sharedLayer/framework/navigation';
import { formatTime, parseTime } from '@/sharedLayer/utils/date';
import { PENALTY_GROUNDS, PENALTY_LIFT_GROUNDS, PenaltyNoteDto } from '@/contracts';
import { PenaltyNoteForm } from './PenaltyNoteForm/PenaltyNoteForm';
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

const ONE_WEEK = 8;

export const GateUserControlPanel: FC<GateUserControlPanelPropsType> = ({
  user,
  isSpectator,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [action, setAction] = useState<ActionType>(null);
  // blocking takes two steps: the term, then the reason. null: the term is not chosen yet
  const [blockDays, setBlockDays] = useState<number | null>(null);
  const router = useRouter();
  const gateUsersCache = useGateUsersCache();
  const { $t } = useIntl();

  const handleOpen = (actionType: ActionType) => {
    console.log('click');
    setAction(actionType);
    setBlockDays(null);
    setIsOpenPopup(true);
  };
  const handleClose = useCallback(() => {
    setIsOpenPopup(false);
  }, [setIsOpenPopup]);

  const deleteUserHandler = (phoneNumber: string, id: string) => {
    setIsLoading(true);
    api
      .deleteGateUser({ phoneNumber, id })
      .then(async () => {
        // the lists lose the user before the list page opens, so the removed user never shows up there
        await gateUsersCache.removed(phoneNumber);
        toast.success($t({ id: 'user deleted successful' }));
        router.push('/users');
      })
      .catch(() => {
        toast.error($t({ id: 'something went wrong' }));
        setIsOpenPopup(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const changeStatusHandler = async (data: GateUserType, days: number, penaltyNote: PenaltyNoteDto) => {
    // console.log(action + '' + phoneNumber);
    setIsLoading(true);

    // console.log(data);
    // setIsLoading(false);
    const changedUser = {
      ...data,
      blackListedFrom: user.isBlackListed
        ? user.blackListedFrom
        : formatTime(Date.now(), false),
      blackListedTo: user.isBlackListed
        ? user.blackListedTo
        : formatTime(getTimestampInDays(days), false),
      isBlackListed: !user.isBlackListed,
    };

    api
      .editGateUser({ ...changedUser, penaltyNote })
      .then(async () => {
        // the cached lists (all users, black list) get the change at once,
        // the card itself is a server rendered page and is rendered again
        await gateUsersCache.changed(changedUser);
        toast.success($t({ id: changedUser.isBlackListed ? 'user blocked successful' : 'user unblocked successful' }));
        router.refresh();
      })
      .catch(() => toast.error($t({ id: 'something went wrong' })))
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
      // the term of a block is only remembered here: the block is confirmed together with its reason
      if (action === 'block') setBlockDays(time);
      // if (action === 'edit') editUserHandler(data);
    },
    [deleteUserHandler, user.phoneNumber, user.idInApi],
  );

  const isTermOver = Boolean(user.blackListedTo) && parseTime(user.blackListedTo!) <= Date.now();

  return (
    <>
      <div className={classes.wrapper}>
        <Button
          onClick={() => handleOpen(user.isBlackListed ? 'unblock' : 'block')}
          variant={user.isBlackListed ? 'primary' : 'warning'}
        >
          {$t({ id: user.isBlackListed ? 'unblock' : 'block' })}
        </Button>
        <Button disabled={isSpectator}>{$t({ id: 'edit' })}</Button>
        <Button
          onClick={() => handleOpen('delete')}
          variant="warning"
          // disabled={isSpectator}
        >
          {$t({ id: 'delete' })}
        </Button>
      </div>
      <Popup
        onClose={handleClose}
        isOpen={isOpenPopup}
        className={classes.popup}
        // className="flex flex-col w-3/4 h-32 max-w-xs justify-between items-center p-5"
      >
        {action === 'edit' && <>Редактирование</>}
        {(action === 'block' || action === 'unblock') && (
          <>
            {user.isBlackListed ? (
              <PenaltyNoteForm
                title={$t({ id: 'penalty note: unblock title' })}
                grounds={PENALTY_LIFT_GROUNDS}
                // once the term is over there is nothing else to say; before that the term is not a reason
                onlyGround={isTermOver ? 'termExpired' : undefined}
                disabledGrounds={isTermOver ? [] : ['termExpired']}
                confirmLabel={$t({ id: 'unblock' })}
                isLoading={isLoading}
                onConfirm={(note) => changeStatusHandler(user, ONE_WEEK, note)}
                onBack={handleClose}
              />
            ) : blockDays !== null ? (
              <PenaltyNoteForm
                title={$t({ id: 'penalty note: block title' })}
                grounds={PENALTY_GROUNDS}
                confirmLabel={$t({ id: 'block' })}
                confirmVariant="warning"
                isLoading={isLoading}
                onConfirm={(note) => changeStatusHandler(user, blockDays, note)}
                onBack={() => setBlockDays(null)}
              />
            ) : (
              <BlockButtons
                confirmAction={confirmAction}
                handleClose={handleClose}
                action={action}
                isLoading={isLoading}
                title={$t({ id: 'block a user for:' })}
              />
            )}
          </>
        )}
        {action === 'delete' && (
          <ConfirmButtons
            confirmAction={confirmAction}
            handleClose={handleClose}
            action={action}
            isLoading={isLoading}
            title={$t({ id: 'delete a user?' })}
          />
        )}
      </Popup>
    </>
  );
};
