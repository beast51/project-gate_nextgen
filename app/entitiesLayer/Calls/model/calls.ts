import { formatTime } from "@/sharedLayer/utils/date"
import { paramsToString } from "@/sharedLayer/utils/paramsToString"
import getSession from "@/widgetsLayer/Sidebar/actions/getSession"
import moment from 'moment-timezone'



type SerializeType = (data: any) => {
  number: string
  time: string

}

const serialize: SerializeType = (data: any) => ({
  number: data.from,
  time: data.date,
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
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }
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
  const url = 'https://cstat.nextel.com.ua:8443/tracking/api/history/get';
  const headers: Record<string, string> = {
    Authorization: 'GzcSkJkMHE11',
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
  // console.log('data', data.calls)
  // console.log('serialize', data.calls.map(serialize))


  const calls = data.calls.reverse().map(serialize)
  return calls
}
export const getAllCallsFromApi = async () => {
  const url = 'https://cstat.nextel.com.ua:8443/tracking/api/history/get';
  const headers: Record<string, string> = {
    Authorization: 'GzcSkJkMHE11',
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
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  // const DATE_AND_TIME_NOW = formatTime(Date.now(), false);
  const DATE_AND_TIME_NOW = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
  try {
    const timeOfLastUpdateCalls = await prisma?.lastCallsRequestFromApi.update({
      where: {
        id: ID_OF_LAST_CALLS_UPDATE_IN_API,
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

export const getCallsByTimeRangeWithoutBlocked = async (from: any, to: any) => {
  console.log('Try to get calls by time range', from, to)
  const session = await getSession();

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

type CallType = {
  number: string
  time: string
  carNumber: string
  apartmentNumber: string | null
  image: string | null
  isBlackListed?: boolean | null
  blackListedFrom: string | null
  blackListedTo: string | null
}

type CallsType = CallType[]

export const setCalls = async (arrayCalls: CallsType) => {
  const session = await getSession();

  if (!session?.user?.email) {
    return null
  }

  for (const call of arrayCalls) {
    // console.log('call', call)
 
    // console.log('info', info)
    // console.log('here works')
    // console.log('call', call)
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








