

import { parseTime } from '@/sharedLayer/utils/date'
import { getCallsByTimeRangeWithoutBlocked, getCallsFromApi, isTimeToUpdateCalls, setCalls, setTimeOfLastUpdateCalls } from '../../../Calls/model/services/calls'
import moment from "moment"
import getSession from '@/widgetsLayer/Sidebar/actions/getSession'



export type ViolationType = {
  name: string
  number: string
  time: {
    from: string, 
    to: string, 
    violationTime: string,  
    dateOfViolation: string
  }[]
}
// export type ViolationType = {
//   name: string
//   number: string
//   time: {from: string, to: string, violationTime: string}[]
//   timesPerDay: number
//   dateOfViolation: string[]
// }
export type FindViolationsType = (from: string | undefined , to: string | undefined) => Promise<ViolationType[]>

export const findViolations: any = async (from: string, to: string, phoneNumber="") => {
  const violations: ViolationType[] = []

  // const calls = await getCallsFromApi(from, to)
  const session = await getSession();
  const isDemo = session?.user?.name === 'spectator'
    const isTimeToUpdate = isDemo ? false : await isTimeToUpdateCalls()

  if (isTimeToUpdate) {
    console.log('violations update started')
    const calls = await getCallsFromApi(from, to, phoneNumber)
    await setCalls(calls)
    await setTimeOfLastUpdateCalls()
    console.log('calls update complete')
  }
  console.log('get calls from mongodb')
  const calls = await getCallsByTimeRangeWithoutBlocked(from, to)

  type violationsListType = {
    time: string[],
    details: {
      carNumber: string[],
      image?: string | null,
      apartmentNumber?: string | null,
      name?: string | null
    } | null
  }
  
  console.log(
    'before grouped calls'
  )
  // const groupedCalls = calls.reduce((grouped: Record<string, string[]>, call: CallType) => {
//old version without his and her cars
  //   const groupedCalls = calls.reduce((
//     grouped: Record<string, violationsListType>, 
//     call: {
//       number: string;
//       carNumber: string[];
//       image: string | null;
//       apartmentNumber: string | null;
//       time: string;
//       callerName: string | null;
// }) => {
//     if (!grouped[call.number]) {
//       grouped[call.number] = {time: [], details: null}
//     }
//     if (!grouped[call.number].details) {
//       grouped[call.number].details = {
//         carNumber: call.carNumber,
//         image: call.image,
//         apartmentNumber: call.apartmentNumber,
//         name: call.callerName
//       }
//     }
//     grouped[call.number].time.push(call.time)
//     return grouped
//   }, {})

type CallType = {
  number: string;
  carNumber: string[];
  image: string | null;
  apartmentNumber: string | null;
  time: string;
  callerName: string | null;
};

type CallDetails = {
  carNumber: string[];
  image?: string | null;
  number: string[];
  name?: string | null;
};

type newViolationsListType = {
  time: string[];
  details: CallDetails | null;
};

const callsWithoutApartment: any = []

// function isMoreThanTwoMinutes(date1: any, date2: any) {
//   const firstDate = new Date(date1);
//   const secondDate = new Date(date2);

//   // Разница в миллисекундах
//   const diff = Math.abs(firstDate.getTime() - secondDate.getTime());

//   // Преобразование разницы в минуты
//   const diffMinutes = diff / (1000 * 60);

//   return diffMinutes > 2;
// }

// const clearsCallsFromFalseCall = (calls: any) => {
//   const result = []
//   for(let call in calls) {
//     console.log('call', calls[call])
//     if (!(calls[Number(call) - 1] !== undefined) && (calls[call].number === calls[(Number(call) - 1).toString()].number) && isMoreThanTwoMinutes(calls[Number(call)].time, calls[Number(call) - 1].time)) {
//       result.push(calls[call])
//     }
//   }
//   return result 
// }

function isMoreThanTwoMinutes(date1: any, date2: any) {
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  const diff = Math.abs(firstDate.getTime() - secondDate.getTime());
  const diffMinutes = diff / (1000 * 60);
  return diffMinutes > 2;
}

// function filterCalls(calls: CallType[]) {
//   return calls.filter((call, index) => {
//       if (index === 0) return true; // Всегда включать первый вызов в массиве
//       const previousCall = calls[index - 1];
//       return call.number !== previousCall.number || isMoreThanTwoMinutes(call.time, previousCall.time);
//   });
// }

function checkCalls(currentCall: any, previousCalls: any) {
  for (let i = 0; i < previousCalls.length; i++) {
      if (currentCall.number === previousCalls[i].number && !isMoreThanTwoMinutes(currentCall.time, previousCalls[i].time)) {
          return false;
      }
  }
  return true;
}

function filterCalls(calls: CallType[]) {
  return calls.filter((call, index) => {
      if (index < 2) return true; // Всегда включать первые два вызова в массиве
      const previousCalls = [calls[index - 1], calls[index - 2]];
      return checkCalls(call, previousCalls);
  });
}


const clearedCalls = filterCalls(calls)
console.log('!!!!!!!!!!!', clearedCalls)

const groupedByApart = clearedCalls.reduce((grouped: Record<string, newViolationsListType>, call: CallType) => {
  if (call.apartmentNumber) {
      const apartmentNumber = call.apartmentNumber;
      if (!grouped[apartmentNumber]) {
          grouped[apartmentNumber] = { time: [], details: null };
      }
      if (!grouped[apartmentNumber].details) {
          grouped[apartmentNumber].details = {
              number: [call.number],
              carNumber: call.carNumber,
              image: call.image,
              name: call.callerName,
          };
      } else if (grouped[apartmentNumber].details && !grouped[apartmentNumber].details?.number.includes(call.number)) {
          grouped[apartmentNumber].details?.number.push(call.number);
      }

      const timeOfLastCallFromThisNumber = grouped[call.apartmentNumber].time[grouped[call.apartmentNumber].time.length - 1] 
      const SECONDS_BETWEEN_TWO_CALLS = 118

      if (timeOfLastCallFromThisNumber) {
        let prevCallTime = parseTime(timeOfLastCallFromThisNumber);
        let nextCallTime = parseTime(call.time);
        let diffInSeconds = Math.abs(nextCallTime - prevCallTime) / 1000;
        if (diffInSeconds > SECONDS_BETWEEN_TWO_CALLS) {
          grouped[call.apartmentNumber].time.push(call.time)
        }
      } else {
        grouped[call.apartmentNumber].time.push(call.time)
      }

  } else {
    callsWithoutApartment.push(call)
  }
  return grouped;
}, {} as Record<string, newViolationsListType>);

console.log('groupedByApart', groupedByApart)
// console.log('callsWithoutApartment', callsWithoutApartment)


const groupedCallsByNumber = callsWithoutApartment.reduce((
  grouped: Record<string, violationsListType>, 
  call: {
    number: string;
    carNumber: string[];
    image: string | null;
    apartmentNumber: string | null;
    time: string;
    callerName: string | null;
}) => {
  if (!grouped[call.number]) {
    grouped[call.number] = {time: [], details: null}
  }
  if (!grouped[call.number].details) {
    grouped[call.number].details = {
      carNumber: call.carNumber,
      image: call.image,
      apartmentNumber: call.apartmentNumber,
      name: call.callerName
    }
  }
  const timeOfLastCallFromThisNumber = grouped[call.number].time[grouped[call.number].time.length - 1] 
  const SECONDS_BETWEEN_TWO_CALLS = 118
  // console.log('timeFromLastCallFromThisNumber', timeOfLastCallFromThisNumber)
  if (timeOfLastCallFromThisNumber) {
    let prevCallTime = parseTime(timeOfLastCallFromThisNumber);
    let nextCallTime = parseTime(call.time);
    let diffInSeconds = Math.abs(nextCallTime - prevCallTime) / 1000;
    if (diffInSeconds > SECONDS_BETWEEN_TWO_CALLS) {
      grouped[call.number].time.push(call.time)
    }
  } else {
    grouped[call.number].time.push(call.time)
  }
  // grouped[call.number].time.push(call.time)
  return grouped
}, {})

console.log('groupedCallsByNumber', groupedCallsByNumber)



const groupAll = (groupedByApart: Record<string, newViolationsListType>, groupedCallsByNumber: Record<string, violationsListType>) => {
  return {
    ...groupedByApart,
    ...groupedCallsByNumber
  }
}

const groupedAllCalls = groupAll(groupedByApart, groupedCallsByNumber)


// const groupedCalls = calls.reduce((
//   grouped: Record<string, violationsListType>, 
//   call: {
//     number: string;
//     carNumber: string[];
//     image: string | null;
//     apartmentNumber: string | null;
//     time: string;
//     callerName: string | null;
// }) => {
//   if (!grouped[call.number]) {
//     grouped[call.number] = {time: [], details: null}
//   }
//   if (!grouped[call.number].details) {
//     grouped[call.number].details = {
//       carNumber: call.carNumber,
//       image: call.image,
//       apartmentNumber: call.apartmentNumber,
//       name: call.callerName
//     }
//   }
//   const timeOfLastCallFromThisNumber = grouped[call.number].time[grouped[call.number].time.length - 1] 
//   const SECONDS_BETWEEN_TWO_CALLS = 118
//   // console.log('timeFromLastCallFromThisNumber', timeOfLastCallFromThisNumber)
//   if (timeOfLastCallFromThisNumber) {
//     let prevCallTime = parseTime(timeOfLastCallFromThisNumber);
//     let nextCallTime = parseTime(call.time);
//     let diffInSeconds = Math.abs(nextCallTime - prevCallTime) / 1000;
//     if (diffInSeconds > SECONDS_BETWEEN_TWO_CALLS) {
//       grouped[call.number].time.push(call.time)
//     }
//   } else {
//     grouped[call.number].time.push(call.time)
//   }
//   // grouped[call.number].time.push(call.time)
//   return grouped
// }, {})

const groupByApartAndCar = (groupedCalls: Record<string, violationsListType>): Record<string, violationsListType> => {
  let groupedByApartAndCar: Record<string, violationsListType> = {};

  for (let callNumber in groupedCalls) {
    let call = groupedCalls[callNumber];

    // Группировка по номеру квартиры
    if (call.details?.apartmentNumber) {
      if (!groupedByApartAndCar[call.details.apartmentNumber]) {
        groupedByApartAndCar[call.details.apartmentNumber] = {
          time: [...call.time],
          details: call.details,
        };
      } else {
        groupedByApartAndCar[call.details.apartmentNumber].time.push(...call.time);
      }
    }

    // Группировка по номеру автомобиля
    // if (call.details?.carNumber) {
    //   for (let carNum of call.details.carNumber) {
    //     if (!groupedByApartAndCar[carNum]) {
    //       groupedByApartAndCar[carNum] = {
    //         time: [...call.time],
    //         details: call.details,
    //       };
    //     } else {
    //       groupedByApartAndCar[carNum].time.push(...call.time);
    //     }
    //   }
    // }
  }
  return groupedByApartAndCar;
};



// const groupedByApartmentAndCar = groupByApartAndCar(groupedCalls);



// console.log('groupedByApartmentAndCar', groupedByApartmentAndCar)

const groupByNumberAndApartment = (groupedCalls: Record<string, violationsListType>, groupedByApartmentAndCar: Record<string, violationsListType>) => {
  // let groupedByNumberAndApartment: Record<string, violationsListType> = {};

  for (let callNumber in groupedCalls) {
    if (groupedCalls[callNumber].time.length === 1) {
      for(let apartmentNumber in groupedByApartmentAndCar) {
        if (groupedCalls[callNumber].details?.apartmentNumber === apartmentNumber && groupedByApartmentAndCar[apartmentNumber].time.length > 1) {
          groupedCalls[callNumber].time = groupedByApartmentAndCar[apartmentNumber].time
        }
      }
    }
  }

  return groupedCalls
}

// let groupedByNumberAndApartment = groupByNumberAndApartment(groupedCalls, groupedByApartmentAndCar)
// console.log('groupedByNumberAndApartment', groupedByNumberAndApartment)

// const groupedByNumberAndApartment = groupedCalls.reduce

//   const groupedCalls = calls.reduce(( -- original
//     grouped: Record<string, string[]>, 
//     call: {
//       number: string;
//       carNumber: string | null;
//       image: string | null;
//       apartmentNumber: string | null;
//       time: string;
//       callerName: string | null;
// }) => {
//     if (!grouped[call.number]) {
//       grouped[call.number] = []
//     }
//     grouped[call.number].push(call.time)
//     return grouped
//   }, {})

  // const groupedCalls = calls.reduce((grouped: any, call: any) => {
  //   if (!grouped[call.number]) {
  //     grouped[call.number] = { calls: [], details: {
  //       carNumber: call.carNumber,
  //       image: call.image,
  //       apartmentNumber: call.apartmentNumber,
  //       name: call.callerName,
  //     }
  //   }
  //   grouped[call.number].push(call.time)
  //   return grouped
  // }, {})


  // console.log('current task', groupedCalls)

  const a = {
    '380932808527': [
      '2023-05-10 13:37:05',
      '2023-05-10 14:34:50',
      '2023-05-10 15:05:46'
    ],
    '380932808528': [
     '2023-05-10 13:37:05',
      '2023-05-10 14:34:50',
    ],
    '380932808529': [
      '2023-05-10 13:37:05',
    ],
    '380932808530': [
     '2023-05-10 13:37:05',
     '2023-05-10 14:34:50',
      '2023-05-10 15:05:46',
      '2023-05-10 16:34:50',
     '2023-05-10 17:05:46'
    ],
    '380932808531': [
     '2023-05-10 13:37:05',
      '2023-05-10 14:00:50',
      '2023-05-10 15:05:46',
      '2023-05-10 15:30:50',
    ],
  }

  // const checkViolation = (calls: any) => {

  //   const blockList = []

  //   for (let phoneNumber in calls) {
  //     const countOfCalls = calls[phoneNumber].length
  //     const pairsOfCalls = []
  //     const countOfPairs = Math.floor(countOfCalls / 2)
  //     for (let i = 0; i < countOfCalls; i++) {

  //     }
  //   }

  //   // const countOfCalls = calls.phoneNumber.length
  //   // if (countOfCalls % 2 !== 0) {
  //   //   return console.log('let`s block')
  //   // }
  //   // console.log('countOfCalls', countOfCalls)
  // }
  // checkViolation(a)

  type VisitInfo = {
    timeIn: string;
    timeOut: Date | string | null ;
    thisVisitTime: number | null;
    violationTime: number | null;
    violation: string;
  };
  
  type VisitDetails = {
    visitCount: number;
    violationCount: number;
    visits: VisitInfo[];
    aboutUser: {
      carNumber: string | null,
      image?: string | null,
      apartmentNumber?: string | null,
      name?: string | null
    } | {}
  };
  
  type VisitsInput = {
    [phone: string]: violationsListType;
  };
  
  type VisitsOutput = {
    [phone: string]: VisitDetails;
  };
  
  const LIMIT_TIME = 45;
  
  function processVisits(visits: VisitsInput): VisitsOutput {
    const result: VisitsOutput = {};
   
    for (const number in visits) {
      // console.log('!!!!!!!!!!', visits)
      let violationCount = 0;
      let visitCount = Math.ceil(visits[number].time.length / 2);
      let info: VisitInfo[] = [];
      for (let i = 0; i < visits[number].time.length; i += 2) {
        let inTime = new Date(visits[number].time[i]);
        let outTime = visits[number].time[i + 1] ? new Date(visits[number].time[i + 1]) : null;
        let timeNow = new Date();
        let differenceInMinutes;
        let violationInfo: VisitInfo = {
          timeIn: moment(inTime).format("YYYY-MM-DD HH:mm:ss"),
          timeOut: null,
          thisVisitTime: null,
          violationTime: null,
          violation: ""
        };
  
        // если не было выезда, то считаем нарушением
        if (!outTime && (timeNow.getTime() - inTime.getTime()) / (1000 * 60) >= LIMIT_TIME) {
          violationInfo.violation = "still parked or train";
          violationCount++;
        } 
        // else if (!outTime) {
        //   violationInfo.violation = "не выехал";
        //   violationCount++;
        // }  
        else if (outTime) {
          outTime = new Date(outTime);
          violationInfo.timeOut = moment(outTime).format("YYYY-MM-DD HH:mm:ss");
          // если разница во времени более или равно 45 минут, то считаем нарушением
          differenceInMinutes = Math.floor((outTime.getTime() - inTime.getTime()) / (1000 * 60));
          violationInfo.violationTime = differenceInMinutes;
          if (differenceInMinutes >= LIMIT_TIME) {
            violationInfo.violation = `has been parked for ${Math.floor(differenceInMinutes)} minutes`;
            violationCount++;
          } else {
            violationInfo.violation = "no violation";
          }
        }
  
        info.push(violationInfo);
       
      }
      
      result[number] = {
        visitCount,
        violationCount,
        visits: info,
        aboutUser: visits[number].details!,
      };
    }
    // console.log('result of violations', result)
    return result;
  }

  // return processVisits(groupedCalls)
  return processVisits(groupedAllCalls)

  

  

  // return violations
}
