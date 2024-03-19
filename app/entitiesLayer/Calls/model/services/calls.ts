import { getPrismaClient } from "@/appLayer/libs/prismadb"
import { formatTime } from "@/sharedLayer/utils/date"
import { paramsToString } from "@/sharedLayer/utils/paramsToString"
import getSession from "@/widgetsLayer/Sidebar/actions/getSession"
import moment from 'moment-timezone'


// import prisma from '@/appLayer/libs/prismadb'

type SerializeType = (data: any) => {
  number: string
  time: string

}

const serialize: SerializeType = (data: any) => ({
  number: data.from,
  time: data.date,
})
const ExtendedSerialize: SerializeType = (data: any) => ({
  number: data.from,
  time: data.date,
  secondsFullTime: data?.secondsFullTime,
  cause: data?.cause,
  state: data?.state
})

export type getInfoFromPhoneNumberType = {
  id: string
  name: string | null
  carNumber: string[] | []
  apartmentNumber: string | null
  image: string | null
  isBlackListed: boolean | null
  blackListedFrom: string | null
  blackListedTo: string | null
} | null

export const getInfoFromPhoneNumber =  async (phoneNumber: string): Promise<getInfoFromPhoneNumberType> => {
  
  const prisma = getPrismaClient("DATABASE_URL");

  try {
    const info = await prisma?.gateUser.findUnique({
      where: {
        phoneNumber: phoneNumber
      },
      select: {
        id: true,
        name: true,
        carNumber: true,
        apartmentNumber: true,
        image: true,
        isBlackListed: true,
        blackListedFrom: true,
        blackListedTo: true,
      }
    })

    if (info) {return  info} else return null
  } catch (error) {
    return null
  }  
}

export const getCallsFromApi = async (from: any, to: any, phoneNumber = '') => {
  // const session = await getSession();
  // const isDemo = session?.user?.name === 'spectator'

  const url = `${process.env.UNITALK_URL}/api/history/get`;
  const headers: Record<string, string> = {
    Authorization: process.env.UNITALK_INTERNAL_API_AUTHORIZATION!,
    ProjectId: process.env.UNITALK_PROJECT_ID!,
    'Content-Type': 'application/json',
  };
  const payload = { 
    "dateFrom": paramsToString(from),  
    "dateTo": paramsToString(to),  
    "limit": 1000,  
    "offset": 0,  
    "filter": {  
      "direction": "IN",
      // "calledFrom": [phoneNumber],
    }   
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  console.log(data)
  const calls = data?.calls?.reverse()?.map(serialize)
  return calls
}
export const getExtendedCallsFromApi = async (from: any, to: any, phoneNumber = '') => {

  const url = `${process.env.UNITALK_URL}/api/history/get`;
  const headers: Record<string, string> = {
    Authorization: process.env.UNITALK_INTERNAL_API_AUTHORIZATION!,
    ProjectId: process.env.UNITALK_PROJECT_ID!,
    'Content-Type': 'application/json',
  };
  const payload = { 
    "dateFrom": paramsToString(from),  
    "dateTo": paramsToString(to),  
    "limit": 1000,  
    "offset": 0,  
    "filter": {  
      "direction": "IN",
      // "calledFrom": [phoneNumber],
    }   
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })
  const data = await response.json()

  const calls = data?.calls?.reverse()?.map(ExtendedSerialize)
  // console.log(calls)
  return calls
}


export const getAllCallsFromApi = async () => {
  const session = await getSession();
  const isDemo = session?.user?.name === 'spectator'

  const url = `${process.env.UNITALK_URL}/api/history/get`;
  const headers: Record<string, string> = {
    Authorization: process.env.UNITALK_INTERNAL_API_AUTHORIZATION!,
    ProjectId: isDemo ? process.env.DEMO_UNITALK_PROJECT_ID! : process.env.UNITALK_PROJECT_ID!,
    'Content-Type': 'application/json',
  };
  const START_DATE = "2023-05-01 00:00:00"
  const DATE_AND_TIME_NOW = formatTime(Date.now(), false);
  const payload = { 
    "dateFrom": START_DATE,  
    "dateTo": DATE_AND_TIME_NOW,  
    "limit": 1000,  
    "offset": 0,  
    "filter": {  
      "direction": "IN",
      // "calledFrom": [phoneNumber],
    }   
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  // console.log('data', data.calls)
  // console.log('serialize', data.calls.map(serialize))


  const calls = data.calls.map(serialize)
  return calls
}

export const getTimeOfLastUpdateCalls = async () => {
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {
    const timeOfLastUpdateCalls = await prisma?.lastCallsRequestFromApi.findFirst({
      select: {
        time: true,
      }
    })
    return timeOfLastUpdateCalls?.time
  } catch(error) { return null}
}

export const createTimeOfLastUpdateCalls = async () => {
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {
    const timeOfLastUpdateCalls = await prisma?.lastCallsRequestFromApi.create({
     data: {
      time: new Date().toISOString()
     }
    })
    return timeOfLastUpdateCalls
  } catch(error) { return null}
}
export const setTimeOfLastUpdateCalls = async () => {
  const ID_OF_LAST_CALLS_UPDATE_IN_API = '647b516f5176fab7f7310a63'
  const DEMO_ID_OF_LAST_CALLS_UPDATE_IN_API = '6599d747845141d32637978d'
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  // const DATE_AND_TIME_NOW = formatTime(Date.now(), false);
  const DATE_AND_TIME_NOW = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
  try {
    const timeOfLastUpdateCalls = await prisma?.lastCallsRequestFromApi.update({
      where: {
        id: session?.user?.name === 'spectator' ? DEMO_ID_OF_LAST_CALLS_UPDATE_IN_API : ID_OF_LAST_CALLS_UPDATE_IN_API,
      },
     data: {
      time: DATE_AND_TIME_NOW
     }
    })
    return timeOfLastUpdateCalls?.time
  } catch(error) { return null}
}

export const isTimeToUpdateCalls = async () => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  const timeOfLastUpdateCalls = await getTimeOfLastUpdateCalls()
  const DATE_AND_TIME_NOW = formatTime(Date.now(), false).toString();
  const date1 = moment(timeOfLastUpdateCalls, 'YYYY-MM-DD HH:mm:ss')
  const date2 = moment(DATE_AND_TIME_NOW, 'YYYY-MM-DD HH:mm:ss')
  let diffSeconds = date2.diff(date1, 'seconds')
  diffSeconds = Math.max(0, diffSeconds);
  console.log('wait seconds to update', 30 - diffSeconds)
  console.log('diffSeconds', diffSeconds)
  return diffSeconds > 30 || diffSeconds === 0
} // toDo this funcion

export const getCallsByTimeRange = async (from: any, to: any) => {
  console.log('Try to get calls by time range', from, to)
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {
    const calls = await prisma?.call.findMany({
      where: {
        time: {
          gte: from,
          lte: to
        }
      },
      select: {
        number: true,
        time: true,
        callerName: true,
        carNumber: true,
        apartmentNumber: true,
        image: true,
        isBlackListed: true,
        blackListedFrom: true,
        blackListedTo: true
      }
    });
    return calls
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}
export const getExtendedCallsByTimeRange = async (from: any, to: any) => {
  console.log('Try to get calls by time range', from, to)
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {
    const calls = await prisma?.call.findMany({
      where: {
        time: {
          gte: from,
          lte: to
        }
      },
      select: {
        number: true,
        time: true,
        callerName: true,
        carNumber: true,
        apartmentNumber: true,
        image: true,
        isBlackListed: true,
        blackListedFrom: true,
        blackListedTo: true,
        secondsFullTime: true,
        cause: true,
        state: true
      }
    });
    return calls
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}

export const getCallsByTimeRangeWithoutBlocked = async (from: any, to: any) => {
  console.log('Try to get calls by time range', from, to)
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {
    const calls = await prisma?.call.findMany({
      where: {
        time: {
          gte: from,
          lte: to
        },
        callerName: {
          not: "Not registered",
        },
        isBlackListed: false,
      },
      select: {
        number: true,
        time: true,
        callerName: true,
        carNumber: true,
        apartmentNumber: true,
        image: true,
        isBlackListed: true,
        blackListedFrom: true,
        blackListedTo: true
      }
    });
    return calls
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}


// const causeList = {
//   '16': 'Довге очикування, але відкрив',
//   '17': 'Відкрив',
//   '18': 'Довге очикування, але відкрив',
//   '19': 'Тимчасово недоступний напрямок алу відкрив',
// };

const causeErrorsList = {
  '31': "Невдале з'єднання",
  '38': 'Помилка зі сторони оператора',
};

export const causeErrorsMap = new Map(
  Object.entries(causeErrorsList).map(([key, value]) => [Number(key), value]),
);
// export const causeMap = new Map(
//   Object.entries(causeList).map(([key, value]) => [Number(key), value]),
// );
 const excludedCausesNumbers = Array.from(causeErrorsMap.keys())

export const getCallsByTimeRangeWithoutBlockedAndWithCause = async (from: any, to: any) => {
 
  // const excludedCausesNumbers = [...causeErrorsMap.keys()];
  console.log('Try to get calls by time range', from, to)
  const session = await getSession();
  const prisma = getPrismaClient(session?.user?.name === 'spectator' ? "DEMO_DATABASE_URL" : "DATABASE_URL");
  if (!session?.user?.email) {
    return [];
  }
  try {
    const calls = await prisma?.call.findMany({
      where: {
        time: {
          gte: from,
          lte: to
        },
        callerName: {
          not: "Not registered",
        },
        isBlackListed: false,
        OR: [
          {
            cause: {
              not: {
                in: excludedCausesNumbers,
              },
            },
          },
          {
            cause: {isSet: false}, 
          },
        ],
      },
      select: {
        number: true,
        time: true,
        callerName: true,
        carNumber: true,
        apartmentNumber: true,
        image: true,
        isBlackListed: true,
        blackListedFrom: true,
        blackListedTo: true
      }
    });
    return calls
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}

type CallType = {
  number: string
  time: string
  carNumber: string
  apartmentNumber: string | null
  image: string | null
  isBlackListed?: boolean | null
  blackListedFrom: string | null
  blackListedTo: string | null
  secondsFullTime: number | null
  cause: number | null
  state: string | null
}

type CallsType = CallType[]

export const setCalls = async (arrayCalls: CallsType) => {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null
  }
  const prisma = getPrismaClient("DATABASE_URL");
  for (const call of arrayCalls) {
    const existingCall = await prisma?.call.findFirst({
      where: {
        number: call.number,
        time: call.time
      },
    });
    if (!existingCall) {
    const info = await getInfoFromPhoneNumber(call.number);
    await prisma?.call.create({
      data: {
        number: call.number,
        time: call.time,
        callerName: info?.name || 'Not registered',
        carNumber: info?.carNumber,
        apartmentNumber: info?.apartmentNumber,
        image: info?.image,
        isBlackListed: info?.isBlackListed || false,
        blackListedFrom: info?.blackListedFrom || '',
        blackListedTo: info?.blackListedTo || '',
        gateUser: info?.id ? {
          connect: {
            id: info?.id, 
          },
        } : undefined
      },
    });
    }
  }

}
export const setExtendedCalls = async (arrayCalls: CallsType) => {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null
  }
  const prisma = getPrismaClient("DATABASE_URL");
  for (const call of arrayCalls) {
    const existingCall = await prisma?.call.findFirst({
      where: {
        number: call.number,
        time: call.time
      },
    });
    if (!existingCall) {
    const info = await getInfoFromPhoneNumber(call.number);
    await prisma?.call.create({
      data: {
        number: call.number,
        time: call.time,
        callerName: info?.name || 'Not registered',
        carNumber: info?.carNumber,
        apartmentNumber: info?.apartmentNumber,
        image: info?.image,
        isBlackListed: info?.isBlackListed || false,
        blackListedFrom: info?.blackListedFrom || '',
        blackListedTo: info?.blackListedTo || '',
        secondsFullTime: call?.secondsFullTime,
        cause: call?.cause,
        state: call?.state,
        gateUser: info?.id ? {
          connect: {
            id: info?.id, 
          },
        } : undefined
      },
    });
    }
  }

}








