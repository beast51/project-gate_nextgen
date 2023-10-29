'use client';
import React from 'react';
import cn from 'classnames';
import classes from './GateUserCard.module.scss';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { GateUserCardProps } from '../GateUserCard.type';
import { CarNumber } from '@/sharedLayer/ui/CarNumber';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';

export const GateUserCard: React.FC<GateUserCardProps> = ({
  data,
  // searchResult,
  // setSearchResult,
  // updateUsersList,
}) => {
  //------{
  // const router = useRouter();
  // const [isLoading, setIsLoading] = useState(false);

  // const handleClick = useCallback(() => {
  //   handleOpen();
  //   console.log('click');
  // }, []);

  //-----}

  // const handleClick = useCallback(() => {
  //   setIsLoading(true);

  //   axios
  //     .post('/api/conversations', { userId: data.id })
  //     .then((data) => {
  //       router.push(`/conversations/${data.data.id}`);
  //     })
  //     .finally(() => setIsLoading(false));
  // }, [data, router]);

  //-----{
  // const [open, setOpen] = useState(false);
  // const handleOpen = () => setOpen(true);
  // const handleClose = () => setOpen(false);

  // const onDeleteHandler = () => {
  //------}

  // const newSearchResult = [
  //   ...searchResult.filter(
  //     (user: GateUserType) => user.phoneNumber !== data.phoneNumber,
  //   ),
  // ];
  // setSearchResult(newSearchResult);

  //------{
  //   updateUsersList(data.phoneNumber);
  //   handleClose();
  // };

  //------}

  // console.log(data.carNumber);

  // const renderCarNumber = (carNumber: string) => {
  //   const regionCode = [];
  //   const number = [];
  //   const vehicleSeries = [];
  //   carNumber.split('').forEach((letter, i) => {
  //     if (i < 2) {
  //       regionCode.push(letter);
  //     }
  //     if (i > 1 && i < 6) {
  //       number.push(letter);
  //     }
  //     if (i >= 6) {
  //       vehicleSeries.push(letter);
  //     }
  //   });
  //   return `${regionCode.join('')} ${number.join('')} ${vehicleSeries.join(
  //     '',
  //   )}`;
  // };

  const pathname = usePathname();
  return (
    <Link
      href={`${pathname}/${data.phoneNumber}`}
      className={cn(
        classes.gateUserCard,
        { [classes.gateUserCardBig]: data.carNumber.length > 4 },
        'full-width',
      )}
    >
      {/* {isLoading && <LoadingModal />} */}
      {/* <div
        // onClick={handleClick}
        className="
          w-full 
          relative 
          flex 
          items-center 
          space-x-3 
          bg-gray-100 
          p-3 
          hover:bg-neutral-100
          rounded-lg
          transition
          cursor-pointer
          mb-2
        "
      > */}
      <Avatar image={data.image} />
      <div
        className={classes.info}
        // className="grid grid-auto gap-x-6 gap-y-2"
      >
        <div className={classes.infoContainer}>
          <p>{data.name}</p>
          <p className="text-sm font-medium text-gray-900 text-end">
            {data.apartmentNumber && `кв. ${data.apartmentNumber}`}
          </p>
        </div>

        <div className={classes.infoWrapper}>
          <div className={classes.carNumber}>
            {data.carNumber?.map((number) => {
              return <CarNumber carNumber={number} />;
            })}
          </div>
        </div>
        <p className={classes.phoneNumber}>
          {formatPhoneNumber(data.phoneNumber)}
        </p>
      </div>
      {/* <div className="min-w-0 flex-1">
          <div className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-900">
                {data.carNumber}
              </p>
              <p className="text-sm font-medium text-gray-900">{data.name}</p>
            </div>
          </div>
        </div> */}
      {/* </div> */}
      {/* <Popup
        onClose={handleClose}
        isOpen={open}
        fullWidth
        fullHeight
        // className="flex items-center justify-center"
      >
        <div className="flex flex-col w-full">
          <div className="flex aspect-w-9 aspect-h-9 w-full h-1/3">
            <Image
              priority
              height="200"
              width="200"
              src={data.image || '/images/placeholder.jpg'}
              alt="Avatar"
              className="w-full relative object-cover"
            />
          </div>
          <div className="flex flex-col justify-between h-full">
            <div className="grid gap-2 p-4">
              <p>{data.name}</p>
              <p>{data.phoneNumber}</p>
              <p>{data.carNumber}</p>
              <p>{data.apartmentNumber}</p>
              <p>Количество нарушений</p>
              <p>Когда нарушал</p>
              <p>Заблокирован до [дата]</p>
            </div>

            <ControlButtons
              data={data}
              phoneNumber={data.phoneNumber}
              id={data.idInApi}
              isBlackListed={data.isBlackListed}
              onDelete={onDeleteHandler}
            />
          </div>
        </div>
      </Popup> */}
    </Link>
  );
};
