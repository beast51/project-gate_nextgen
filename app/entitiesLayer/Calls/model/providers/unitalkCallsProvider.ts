import { paramsToString } from "@/sharedLayer/utils/paramsToString";
import { CallFromApiDataType, CallFromApiType, CallsApiProvider, SerializedCall } from "../types/Calls.type";

export const callState = {
  BUSY: 'BUSY',
  NOANSWER: 'NOANSWER'
}

export const causeDisallowList = {
  '31': "Невдале з'єднання",
  '38': 'Помилка зі сторони оператора',
} as const

export const causeAllowList = {
  '16': 'Довге очикування, але відкрив',
  '17': 'Відкрив',
  '18': 'Довге очикування, але відкрив',
  '19': 'Тимчасово недоступний напрямок алу відкрив',
} as const

const serializeCall = (data: CallFromApiType): SerializedCall => ({
  number: data.from,
  time: data.date,
  secondsFullTime: data?.secondsFullTime,
  cause: data?.cause,
  state: data?.state
})

export const unitalkCallsProvider: CallsApiProvider = {
  getCallsFromApi: async (from: string = '', to: string = '') => {
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
      }   
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    })

    const data: CallFromApiDataType = await response.json()
    const calls = data.calls.reverse().map(serializeCall)

    return calls
  }
}