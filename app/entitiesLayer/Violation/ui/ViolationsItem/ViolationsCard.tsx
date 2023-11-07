'use client';

import clsx from 'clsx';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { VisitsType } from '../../model/types/ViolationList.types';
import Link from 'next/link';
import classes from './ViolationCard.module.scss';
import { useMemo } from 'react';
import cn from 'classnames';
import { usePathname } from 'next/navigation';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import { CarNumbersList } from '@/entitiesLayer/GateUser';

export type ViolationsCardPropsType = {
  phoneNumberOrApartment: string;
  violation: VisitsType;
};

export const ViolationsCard: React.FC<ViolationsCardPropsType> = ({
  phoneNumberOrApartment,
  violation: {
    aboutUser: { carNumber, image, apartmentNumber, number, name },
    violationCount,
    visitCount,
    visits,
  },
}) => {
  const pathname = usePathname();
  console.log(phoneNumberOrApartment);
  return (
    // <Link href={`${pathname}/${data.phoneNumber}`} className={linkClassName}>
    <Link
      href={``}
      className={cn(classes.card, { [classes.withViolation]: violationCount })}
    >
      <div className={classes.container}>
        <Avatar image={image} />
        <div className={classes.info}>
          <div className={classes.infoContainer}>
            <div className={classes.phoneNumber}>
              {apartmentNumber === null
                ? phoneNumberOrApartment
                : number?.map((num) => {
                    return <p>{formatPhoneNumber(num)}</p>;
                  })}
            </div>
            <div className="pr-3">
              {apartmentNumber === null ? (
                <p>{name}</p>
              ) : (
                <p>кв.{phoneNumberOrApartment}</p>
              )}
            </div>
            {/* <p className="text-sm font-medium text-gray-900 text-end">
            {apartmentNumber && `кв. ${apartmentNumber}`}
          </p> */}
          </div>
          {/* <p className={classes.name}>{name}</p> */}
          <div className={classes.infoWrapper}>
            <CarNumbersList carNumber={carNumber} />
          </div>
        </div>
      </div>
      <div className={classes.timesList}>
        {visits.map((visit: VisitsType['visits'][0]) => {
          const IS_VIOLATION =
            (visit.violationTime >= 45 && visitCount > 0) ||
            !visit.violationTime;
          return (
            <div
              className={cn(classes.time, {
                [classes.timeWithViolation]: IS_VIOLATION,
              })}
              key={visit.violationTime}
            >
              {visit.timeIn ? (
                <div>
                  <div>
                    {' '}
                    {visit.violationTime
                      ? `${visit.violationTime} мин.`
                      : '[?]'}{' '}
                  </div>
                  <div
                    className="
                            grid
                            grid-cols-1
                            gap-y-1
                            text-xs
                            grid-rows-auto
                "
                  >
                    <div>{visit.timeIn.split(' ')[1]}</div>
                    <div>{visit.timeOut?.split(' ')[1]}</div>
                  </div>
                </div>
              ) : (
                <div>[ ? ]</div>
              )}
            </div>
          );
        })}
      </div>
    </Link>
    // <li
    //   className={clsx(
    //     `flex
    //     flex-col

    //     mx-4
    //     my-2
    //     hover:bg-neutral-100
    //     rounded-lg
    //     transition
    //     cursor-pointer
    //     p-3
    //     border-2
    //     border-slate-200
    //    `,
    //     violation.violationCount ? 'bg-rose-200/50' : 'bg-green-200/50',
    //   )}
    // >
    //   <div className="grid grid-flow-col grid-cols-[56px,auto] mb-2">
    //     <Avatar image={violation.aboutUser.image} />
    //     <div
    //       // onClick={handleClick}
    //       className="
    //       w-full
    //       relative
    //       grid
    //       grid-cols-1
    //       gap-y-1
    //       grid-rows-auto
    //     "
    //     >
    //       <div
    //         className="
    //         w-full
    //         grid
    //         grid-cols-1
    //         gap-y-1
    //         ml-4
    //         grid-rows-auto"
    //       >
    //         <div className="flex justify-between w-full ">
    //           <div className="text-lg font-medium text-gray-900 ">
    //             {violation.aboutUser.apartmentNumber === null ? (
    //               phoneNumberOrApartment
    //             ) : (
    //               <div>
    //                 {violation.aboutUser.number?.map((num: any) => {
    //                   return (
    //                     <p
    //                       key={num}
    //                       className="text-lg font-medium text-gray-900"
    //                     >
    //                       {num}
    //                     </p>
    //                   );
    //                 })}
    //               </div>
    //             )}
    //           </div>
    //           <div className="pr-3">
    //             {violation.aboutUser.apartmentNumber === null ? (
    //               <p className="text-lg font-medium text-gray-900">
    //                 {violation.aboutUser.name}
    //               </p>
    //             ) : (
    //               <p className="text-lg font-medium text-gray-900">
    //                 кв.{phoneNumberOrApartment}
    //               </p>
    //             )}
    //           </div>
    //         </div>

    //         <div>
    //           {violation.aboutUser.carNumber?.map((number: any) => {
    //             return (
    //               <p key={number} className="text-lg font-medium text-gray-900">
    //                 {number}
    //               </p>
    //             );
    //           })}
    //         </div>

    //         {/* <p className="text-lg font-medium text-gray-900 ml-2">
    //           {violation.aboutUser.carNumber}
    //         </p> */}
    //       </div>
    //       {/* <div className="flex items-center ml-4">
    //         <div className="flex items-center">
    //           <FaExchangeAlt color="green" />
    //           <p className="ml-4">{`: ${violation.visitCount}`}</p>
    //         </div>
    //         {violation.violationCount > 0 && (
    //           <div className="flex items-center ml-2">
    //             <FaExclamationTriangle color="red" />
    //             <p className="ml-2">{`: ${violation.violationCount}`}</p>
    //           </div>
    //         )}
    //       </div> */}
    //     </div>
    //   </div>

    //   <div className="flex items-start line-clamp-1 overflow-hidden flex-wrap">
    //     {/* <div className="flex items-center flex-nowrap">
    //       <BsHourglassSplit />
    //       <p>,&nbsp;мин:</p>
    //     </div> */}

    //     {violation.visits.map((visit: VisitsType['visits'][0]) => (
    //       <div
    //         className={clsx(
    //           'mr-4 mt-2 mb-2 ml-1 text-center bg-white p-1 rounded-lg shadow-1dp',
    //           visit.violationTime >= 45 && violation.visitCount > 0
    //             ? 'text-red-500'
    //             : 'text-green-500',
    //         )}
    //         key={visit.violationTime}
    //       >
    //         {visit.timeIn ? (
    //           <div>
    //             <div>
    //               {' '}
    //               {visit.violationTime
    //                 ? `${visit.violationTime} мин.`
    //                 : '[?]'}{' '}
    //             </div>
    //             <div
    //               className="
    //                         grid
    //                         grid-cols-1
    //                         gap-y-1
    //                         text-xs
    //                         grid-rows-auto
    //             "
    //             >
    //               <div>{visit.timeIn.split(' ')[1]}</div>
    //               <div>{visit.timeOut?.split(' ')[1]}</div>
    //             </div>
    //           </div>
    //         ) : (
    //           <div>[ ? ]</div>
    //         )}
    //       </div>
    //     ))}
    //   </div>
    // </li>
  );
};
