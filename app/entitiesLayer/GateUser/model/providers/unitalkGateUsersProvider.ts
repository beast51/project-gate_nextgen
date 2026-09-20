import getSession from "@/widgetsLayer/Sidebar/actions/getSession"
import { Contact, GateUserType, GateUsersFromApiType } from "../types/GateUser.type";
import { NewGateUser } from "@/core/entities/gateUser";
import { formatCarNumber } from "@/sharedLayer/utils/formatCarNumber";

const serialize = (data: Contact) => ({
  idInApi: data.id.toString(),
  name: data.name,
  phoneNumber: data.phones[0],
  carNumber: data.note?.split(',') || [],
  apartmentNumber: data.address,
  isBlackListed: data.responsible ? false : true
})

export const unitalkGateUsersProvider = () => {
  const UNITALK_AUTHORIZATION = process.env.UNITALK_AUTHORIZATION;
  const UNITALK_PROJECT_ID = process.env.UNITALK_PROJECT_ID;
  const CAN_OPEN_GATES = process.env.UNITALK_CAN_OPEN_GATES;
  const UNITALK_URL = process.env.UNITALK_URL;

  if (!UNITALK_AUTHORIZATION || !UNITALK_PROJECT_ID || !UNITALK_URL || !CAN_OPEN_GATES) {
    throw new Error("One or more required environment variables are missing.");
  }

  const headers: Record<string, string> = {
    Authorization: UNITALK_AUTHORIZATION,
    ProjectId: UNITALK_PROJECT_ID,
    'Content-Type': 'application/json',
  };

  return {
    addGateUserToApi:  async (body: NewGateUser) => {   
      const url = `${UNITALK_URL}/contacts/set`;
  
      const payload = { 
        "address": body.apartmentNumber,  
        "email": '',  
        "name": body.name,
        "note": formatCarNumber(body.carNumber),
        'phones': [body.phoneNumber],
        "responsible": CAN_OPEN_GATES, 
      };
    
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      })
    
      if (response.ok) {
        const data = await response.json();
      } else {
        throw new Error('Network response was not ok.');
      }
    },
    deleteGateUserFromApi: async (id: string) => {
      const headers: Record<string, string> = {
        Authorization: UNITALK_AUTHORIZATION,
        ProjectId: UNITALK_PROJECT_ID,
      };

      const url = `${UNITALK_URL}/contacts/remove`;
      const formData = new FormData();
      formData.append('id', id);
    
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      })
      console.log('after delete from api', response.status)
    },
    editGateUserOnApi: async (body: NewGateUser & {id: string, isBlackListed: boolean}) => {  
      const url = `${UNITALK_URL}/contacts/set`;
    
      const payload = { 
        "address": body.apartmentNumber,  
        "email": '', 
        "id": Number(body.id), 
        "name": body.name,
        "note": formatCarNumber(body.carNumber),
        'phones': [body.phoneNumber],
        "responsible": body.isBlackListed ? null : CAN_OPEN_GATES, 
      };
    
      console.log('payload', payload)
    
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      })
      console.log('\nedited ' + body.phoneNumber)
  
    },
    getGateUsersFromApi: async (phoneNumber = "", name = ""): Promise<GateUserType[]> => {
      const url = `${UNITALK_URL}/contacts/get`;  
      const limit = 100;
      const initialOffset = 0;
    
      const initialPayload = {
        "limit": limit,
        "offset": initialOffset,
        "filter": {
          "name": name,
          "phone": phoneNumber
        }
      };
     
      const initialResponse = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(initialPayload),
      });
    
      const initialData: GateUsersFromApiType = await initialResponse.json();
      const totalRecords = initialData.count;
    
      const totalPages = Math.ceil(totalRecords / limit);
    
      const promises = Array.from({ length: totalPages }, (_, index) => {
        const offset = index * limit;
        const payload = {
          "limit": limit,
          "offset": offset,
          "filter": {
            "name": name,
            "phone": phoneNumber
          }
        };
    
        return fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => data.contacts.map(serialize));
      });
    
      const results = await Promise.all(promises);
    
      return results.flat();
    }
  }
}

export { formatCarNumber };
