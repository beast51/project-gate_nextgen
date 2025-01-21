import { databaseList, getPrismaClient } from "@/appLayer/libs/prismadb";
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
import moment from 'moment-timezone';
import { formatTime } from "@/sharedLayer/utils/date";
import { CallsType, SerializedCall, getInfoFromDatabaseByPhoneNumberType } from "../types/Calls.type";
import { causeDisallowList } from "../providers/unitalkCallsProvider";
import { unitalkApiCalls } from "../services/apiCalls";

export const shotaConfig = {
  databaseKey: databaseList.DATABASE_URL
}

export const demoConfig = {
  databaseKey: databaseList.DEMO_DATABASE_URL
}

export const causeErrorsMap = new Map(
  Object.entries(causeDisallowList).map(([key, value]) => [Number(key), value])
)

const excludedCausesNumbers = Array.from(causeErrorsMap.keys())
const { getCallsFromApi } = unitalkApiCalls;

export const mongoDbCallsProvider = (databaseKey: databaseList) => {
  const ID_OF_LAST_CALLS_UPDATE_IN_API = '647b516f5176fab7f7310a63';
  const DEMO_ID_OF_LAST_CALLS_UPDATE_IN_API = '6599d747845141d32637978d';
  const DATE_AND_TIME_NOW = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
  const RATE_LIMIT_INTERVAL_SECONDS = 10;
  const prisma = getPrismaClient(databaseKey);

  const getUserInfoFromDatabaseByPhoneNumber = async (phoneNumber: string): Promise<getInfoFromDatabaseByPhoneNumberType | null> => {
    try {
      const info = await prisma.gateUser.findUnique({
        where: { phoneNumber },
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
      });

      return info || null;
    } catch (error) {
      return null;
    }
  };
  const getLastCallFromDatabase = async () => {
    try {
      const lastCall = await prisma.call.findFirst({
        orderBy: {
          time: 'desc'
        }
      })
      return lastCall
    } catch {
      return null
    }
  } 
  const getExistingCallFromDatabase = async (number: string, time: string) => {
    try {
      const existingCall = await prisma.call.findFirst({
        where: {
          number,
          time
        },
      })
      return existingCall
    } catch {
      return null
    }
  } 
  const writeCallToDatabase = async (callData: SerializedCall, userInfo: getInfoFromDatabaseByPhoneNumberType) => {
    try {
      await prisma.call.create({
        data: {
          number: callData.number,
          time: callData.time,
          callerName: userInfo?.name || 'Not registered',
          carNumber: userInfo?.carNumber,
          apartmentNumber: userInfo?.apartmentNumber,
          image: userInfo?.image,
          isBlackListed: userInfo?.isBlackListed || false,
          blackListedFrom: userInfo?.blackListedFrom || '',
          blackListedTo: userInfo?.blackListedTo || '',
          secondsFullTime: callData?.secondsFullTime,
          cause: callData?.cause,
          state: callData?.state,
          gateUser: userInfo?.id ? {
            connect: {
              id: userInfo?.id,
            },
          } : undefined
        },
      });
    } catch {}
  }
  const getTimeOfLastUpdateCalls = async () => {
    try {
      const timeOfLastUpdateCalls = await prisma.lastCallsRequestFromApi.findFirst({
        select: {
          time: true,
        }
      })
      return timeOfLastUpdateCalls && timeOfLastUpdateCalls.time
    } catch {
      console.error('failed to receive time of last update calls')
      return null
    }
  }
  const setCallsToDatabase = async (arrayCalls: SerializedCall[]) => { 
    const session = await getSession();
    if (!session?.user?.email) {
      return null;
    }

    const lastCall = await getLastCallFromDatabase()

    const lastCallTime = lastCall ? new Date(lastCall.time).getTime() : 0

    const newCalls = arrayCalls.filter(call => new Date(call.time).getTime() > lastCallTime)

    for (const call of newCalls) {
      const existingCall = await getExistingCallFromDatabase(call.number, call.time)

      if (!existingCall) {
        const userInfo = await getUserInfoFromDatabaseByPhoneNumber(call.number)
        await writeCallToDatabase(call, userInfo)
      }
    }
  }
  const setTimeOfLastUpdateCalls = async (): Promise<undefined> => {
    const session = await getSession();
    if (!session?.user?.email) {
      return
    }

    try {
      await prisma?.lastCallsRequestFromApi.update({
        where: {
          id: session?.user?.name === 'spectator' ? DEMO_ID_OF_LAST_CALLS_UPDATE_IN_API : ID_OF_LAST_CALLS_UPDATE_IN_API,
        },
        data: {
          time: DATE_AND_TIME_NOW
        }
      })
    } catch (error) { console.error(error) }
  }

  return {
    isTimeToUpdateCalls: async (): Promise<boolean> => {
      const session = await getSession();
      if (!session?.user?.email) {
        return false;
      }
  
      const timeOfLastUpdateCalls = await getTimeOfLastUpdateCalls()
  
      const DATE_AND_TIME_NOW = formatTime(Date.now(), false).toString();
      const date1 = moment(timeOfLastUpdateCalls, 'YYYY-MM-DD HH:mm:ss');
      const date2 = moment(DATE_AND_TIME_NOW, 'YYYY-MM-DD HH:mm:ss');
      let diffSeconds = date2.diff(date1, 'seconds');
      diffSeconds = Math.max(0, diffSeconds);
      console.log('wait seconds to update', RATE_LIMIT_INTERVAL_SECONDS - diffSeconds);
      console.log('diffSeconds', diffSeconds);
      return diffSeconds > RATE_LIMIT_INTERVAL_SECONDS || diffSeconds === 0;
    },
    updateCallsData: async (from: string, to: string) => {
      console.log('calls update started');
      const calls = await getCallsFromApi(from, to);
      console.log('calls', calls);
      console.log('calls from api received');
      // if (!isDemo) {
      //   await shotaDbCalls.setExtendedCalls(calls);
      // }
      await setCallsToDatabase(calls);
      console.log('calls setted to bd');
      await setTimeOfLastUpdateCalls();
      console.log('calls update complete');
    },
    getCallsByTimeRangeWithoutBlockedAndWithCause: async (from: string, to: string): Promise<CallsType> => {
      const session = await getSession();
      console.log('Try to get calls by time range', from, to);

      if (session && !session.user?.email) {
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
                cause: { isSet: false },
              },
            ],
          },
          select: {
            number: true,
            time: true,
            carNumber: true,
            callerName: true,
            apartmentNumber: true,
            image: true,
            isBlackListed: true,
            blackListedFrom: true,
            blackListedTo: true,
            secondsFullTime: true,
            cause: true,
            state: true,
          }
        });
        return calls;
      } catch (error) {
        console.error(error);
        throw new Error('Error receiving data from Call');
      }
    },
    getCallsFromDatabaseByTimeRange: async (from: string, to: string): Promise<CallsType> => {
      console.log('Try to get calls by time range', from, to);
      const session = await getSession();

      if (session && !session.user?.email) {
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

        return calls;
      } catch (error) {
        console.error(error);
        throw new Error('Error receiving data from Call');
      }
    }}
}