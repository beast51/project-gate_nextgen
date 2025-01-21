import { parseTime } from '@/sharedLayer/utils/date'
import moment from "moment"
import getSession from '@/widgetsLayer/Sidebar/actions/getSession'
import { shotaDatabaseCalls } from '@/entitiesLayer/Calls/model/services/dbCalls';
import { VisitsOutput, newViolationsListType, violationsListType, VisitsInput, VisitInfo } from '../types/ViolationList.types';
import { CallType } from '@/entitiesLayer/Calls/model/types/Calls.type';

const {
  isTimeToUpdateCalls,
  updateCallsData,
  getCallsByTimeRangeWithoutBlockedAndWithCause
} = shotaDatabaseCalls;

const LIMIT_TIME = 45;
const SECONDS_BETWEEN_TWO_CALLS = 118

const isMoreThanTwoMinutes = (date1: string, date2: string) => {
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  const difference = Math.abs(firstDate.getTime() - secondDate.getTime());
  const differenceInMinutes = difference / (1000 * 60);
  return differenceInMinutes > 2;
}

export const findViolations = async (from: string, to: string): Promise<VisitsOutput> => {

  const session = await getSession();
  if (session && !session.user?.email) {
    return {};
  }

  const isTimeToUpdate: boolean =  await isTimeToUpdateCalls()

  if (isTimeToUpdate) {
    updateCallsData(from, to)
  }
  console.log('get calls from mongodb')

  const calls = await getCallsByTimeRangeWithoutBlockedAndWithCause(from, to)

  const callsWithoutApartment: CallType[] = []

  const hasPairedCall = (currentCall: CallType, previousCalls: CallType[]) => {
    return !previousCalls.some(previousCall =>
      currentCall.number === previousCall.number && !isMoreThanTwoMinutes(currentCall.time, previousCall.time)
    );
  }

  const filterPairedCalls = (calls: CallType[]) => {
    return calls.filter((call, index) => {
        if (index < 2) return true; // Always include the first two calls in the array.
        const previousCalls = [calls[index - 1], calls[index - 2]];
        return hasPairedCall(call, previousCalls);
    });
  }

  const filteredPairedCalls = filterPairedCalls(calls)
  console.log('filteredPairedCalls: ', filteredPairedCalls)

  const groupCallsByApartmentWithTimeCheck = (call: CallType, grouped: Record<string, newViolationsListType>, timeOfLastCallFromThisNumber: string, SECONDS_BETWEEN_TWO_CALLS: number) => {
    if (timeOfLastCallFromThisNumber) {
      let prevCallTime = parseTime(timeOfLastCallFromThisNumber);
      let nextCallTime = parseTime(call.time);
      let diffInSeconds = Math.abs(nextCallTime - prevCallTime) / 1000;
      if (diffInSeconds > SECONDS_BETWEEN_TWO_CALLS) {
        call.apartmentNumber && grouped[call.apartmentNumber].time.push(call.time);
      }
    } else {
      call.apartmentNumber && grouped[call.apartmentNumber].time.push(call.time);
    }
  };

  const groupedByApartCalls = filteredPairedCalls.reduce((grouped: Record<string, newViolationsListType>, call: CallType) => {
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
        
        groupCallsByApartmentWithTimeCheck(call, grouped, timeOfLastCallFromThisNumber, SECONDS_BETWEEN_TWO_CALLS)
    } else {
      callsWithoutApartment.push(call)
    }
    return grouped;
  }, {} as Record<string, newViolationsListType>);

  console.log('groupedByApart', groupedByApartCalls)

  const groupedByNumberCalls = callsWithoutApartment.reduce((
    grouped: Record<string, violationsListType>, 
    call: CallType) => {
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

    return grouped
  }, {})

  console.log('groupedCallsByNumber', groupedByNumberCalls)

  const groupAll = (groupedByApart: Record<string, newViolationsListType>, groupedCallsByNumber: Record<string, violationsListType>) => {
    return {
      ...groupedByApart,
      ...groupedCallsByNumber
    }
  }

  const groupedAllCalls = groupAll(groupedByApartCalls, groupedByNumberCalls)

  const processVisits = (visits: VisitsInput): VisitsOutput => {
      const result: VisitsOutput = {};
    
      for (const number in visits) {
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
    
          // If there was no exit, we consider it a violation.
          if (!outTime && (timeNow.getTime() - inTime.getTime()) / (1000 * 60) >= LIMIT_TIME) {
            violationInfo.violation = "still parked or train";
            violationCount++;
          } 

          else if (outTime) {
            outTime = new Date(outTime);
            violationInfo.timeOut = moment(outTime).format("YYYY-MM-DD HH:mm:ss");
            // If the time difference is greater than or equal to 45 minutes, we consider it a violation.
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

      return result;
  }

  return processVisits(groupedAllCalls)
}

