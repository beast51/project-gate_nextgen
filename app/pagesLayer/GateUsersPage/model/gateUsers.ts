import prisma from "../../../(appLayer)/libs/prismadb"
import getSession from "../../../widgetsLayer/Sidebar/actions/getSession"
import { formatTime } from "../../../sharedLayer/utils/date"
import moment from "moment"
import fs from 'fs'


export type Contact = {
  address: string
  email: string
  id: number
  name: string
  note: string
  phones: string[]
  responsible: number | null
}
export type GateUsersFromApiType = {
  contacts: Contact[]
  count: number
  limit: number
  offset: number
  users: {
    [key: number]: string
  }
}
export type GateUserType = {
  id?: string,
  idInApi: string;
  name: string;
  phoneNumber: string;
  carNumber: string[];
  apartmentNumber: string;
  isBlackListed: boolean;
  blackListedFrom?: string,
  blackListedTo?: string,
  image?: string
}

const serialize = (data: Contact) => ({
  idInApi: data.id.toString(),
  name: data.name,
  phoneNumber: data.phones[0],
  carNumber: data.note?.split(',') || [],
  // carNumber: typeof data.note === 'string' ?  JSON.parse(data.note.replace(/“/g, '"').replace(/”/g, '"')) : [],
  // carNumber: Array.isArray(data.note) ? JSON.parse(data.note) : data.note !== null ? data.note : [],
  apartmentNumber: data.address,
  isBlackListed: data.responsible ? false : true
})

export type getGateUsersFromApiType = (phoneNumber?: string, name?: string) => Promise<GateUserType[]>

// export const getGateUsersFromApi: getGateUsersFromApiType = async ( phoneNumber = "", name = "") => {
//   const url = 'https://cstat.nextel.com.ua:8443/tracking/contacts/get';
//   const headers: Record<string, string> = {
//     Authorization: 'kddHSkpUbPSc',
//     ProjectId: '6275',
//     'Content-Type': 'application/json',
//   };
//   const payload = { 
//     "limit": 100,  
//     "offset": 0,  
//     "filter": {  
//       "name": name,
//       "phone": phoneNumber
//     }   
//   };
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: headers,
//     body: JSON.stringify(payload),
//   })
//   const data: GateUsersFromApiType = await response.json()
//   console.log('!!data!!', data)

//   const users = data.contacts.map(serialize)
//   const count = data.count;



//   console.log('!!users!!', users)
//   return users
// }

export const getGateUsersFromApi: getGateUsersFromApiType = async (phoneNumber = "", name = "") => {
  const url = 'https://cstat.nextel.com.ua:8443/tracking/contacts/get';
  const headers: Record<string, string> = {
    Authorization: 'kddHSkpUbPSc',
    ProjectId: '6275',
    'Content-Type': 'application/json',
  };

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

// const createFetchPromise = async (offset: number, limit: number, url: string, headers: Record<string, string>): Promise<any> => {
//   const payload = {
//     "limit": limit,
//     "offset": offset,
//     "filter": {
//     }
//   };

//   return fetch(url, {
//     method: 'POST',
//     headers: headers,
//     body: JSON.stringify(payload),
//   })
//   .then(response => response.json())
//   .then(data => data.contacts.map(serialize));
// }

// export const getGateUsersFromApi: getGateUsersFromApiType = async () => {
//   const url = 'https://cstat.nextel.com.ua:8443/tracking/contacts/get';
//   const headers: Record<string, string> = {
//     Authorization: 'kddHSkpUbPSc',
//     ProjectId: '6275',
//     'Content-Type': 'application/json',
//   };

//   const limit = 100;
//   const initialOffset = 0;

//   const initialData = await createFetchPromise(initialOffset, limit, url, headers);
//   const totalRecords = initialData.count;

//   const totalPages = Math.ceil(totalRecords / limit);


//   const promises = [];
//   for (let i = 0; i < totalPages; i++) {
//     const offset = i * limit;
//     promises.push(createFetchPromise(offset, limit, url, headers));
//   }

//   const results = await Promise.all(promises);

//   return results.flat();
// }


export const getNewUserIdFromApi = async (phoneNumber: string) => {

}

export const setGateUsersToBd = async (users: GateUserType[]) => {
  const session = await getSession();
  console.log('users!!!!!!!!!!!!!!!!!', users)
  if (!session?.user?.email) {
    return null
  }
  let index = 0;
  for (const user of users) {
    // console.log('!!!!!!!!!!!!!!! user', user)
    const existingGateUser = await prisma?.gateUser.findFirst({
      where: {
        phoneNumber: user.phoneNumber,
        // carNumber: user.carNumber
      },
    });
    // console.log('user', user)
    if (!existingGateUser) 
    await prisma?.gateUser.create({
      data: {
        id: user.id && user.id,
        idInApi: user.idInApi,
        name: user.name,
        phoneNumber: user.phoneNumber,
        carNumber: Array.isArray(user.carNumber) ? user.carNumber : [user.carNumber] || [],
        apartmentNumber: user.apartmentNumber,
        image: '',
        isBlackListed: user.isBlackListed,
        blackListedFrom: '',
        blackListedTo: ''
      },
    });
    console.log(index + ' out of ' + users.length + ' users download to BD');
    index++;
  }
}


export const createTimeOfLastUpdateGateUser = async () => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  try {
    const timeOfLastUpdateGateUser = await prisma?.lastGateUserRequestFromApi.create({
     data: {
      time: new Date().toISOString()
     }
    })
    return timeOfLastUpdateGateUser
  } catch(error) { return null}
}

export const setTimeOfLastUpdateGateUser = async () => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  const DATE_AND_TIME_NOW = formatTime(Date.now(), false);
  try {
    const timeOfLastUpdateGateUser = await prisma?.lastGateUserRequestFromApi.update({
      where: {
        id: '647cfc09a5c7e5bce588a6a9',
      },
     data: {
      time: DATE_AND_TIME_NOW
     }
    })
    return timeOfLastUpdateGateUser?.time
  } catch(error) { return null}
}

export const getTimeOfLastUpdateGateUser = async () => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  try {
    const timeOfLastUpdateGateUser = await prisma?.lastGateUserRequestFromApi.findFirst({
      select: {
        time: true,
      }
    })
    return timeOfLastUpdateGateUser?.time
  } catch(error) { return null}
}

export const isTimeToUpdateGateUser = async () => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  const timeOfLastUpdateCalls = await getTimeOfLastUpdateGateUser()
  const DATE_AND_TIME_NOW = formatTime(Date.now(), false).toString();
  const date1 = moment(timeOfLastUpdateCalls, 'YYYY-MM-DD HH:mm:ss')
  const date2 = moment(DATE_AND_TIME_NOW, 'YYYY-MM-DD HH:mm:ss')
  const diffMinutes = date2.diff(date1, 'minutes')

  return diffMinutes > 2
}

export const getGateUserFromDb = async (name="") => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  try {
    const gateUsers = await prisma?.gateUser.findMany() as GateUserType[]

    return gateUsers
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}

export const addGateUserToApi = async (body: {
  name?: string
  phoneNumber: string
  carNumber: string
  apartmentNumber: string
}) => {
  const CAN_OPEN_GATES = "20879";
  const url = 'https://cstat.nextel.com.ua:8443/tracking/contacts/set';
  const headers: Record<string, string> = {
    Authorization: 'kddHSkpUbPSc',
    ProjectId: '6275',
    'Content-Type': 'application/json',
  };
  const payload = { 
    "address": body.apartmentNumber,  
    "email": '',  
    "name": body.name,
    "note": body.carNumber.toUpperCase(),
    'phones': [body.phoneNumber],
    "responsible": CAN_OPEN_GATES, 
  };
console.log(payload)

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })
  // console.log('response', response)
}

export const editGateUserOnApi = async (body: {
  name?: string
  phoneNumber?: string
  carNumber?: string[]
  apartmentNumber?: string
  id?: string
  isBlackListed?: boolean
}) => {
  const CAN_OPEN_GATES = "20879";
  const url = 'https://cstat.nextel.com.ua:8443/tracking/contacts/set';
  const headers: Record<string, string> = {
    Authorization: 'kddHSkpUbPSc',
    ProjectId: '6275',
    'Content-Type': 'application/json',
  };
  const payload = { 
    "address": body.apartmentNumber,  
    "email": '', 
    "id": Number(body.id), 
    "name": body.name,
    "note": body.carNumber?.join(','),
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
  // console.log('response', response)
}

export const editGateUserInDb = async (data: {
  idInApi?: string,
  name?: string,
  phoneNumber: string,
  carNumber?: string[],
  apartmentNumber?: string,
  image?: string,
  isBlackListed?: boolean,
  blackListedFrom?: string,
  blackListedTo?: string,
}) => {
  const session = await getSession();

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma?.gateUser.update({
    where: {
      phoneNumber: data.phoneNumber,
    },
    data,
  });
  console.log('user is now: ', user)
}

export type GateUsersInfoForDeleteAll = {
  idInApi: string
  phoneNumber: string
}

export const getAllInfoForDeleteAllUsers = async () => {
  const session = await getSession();
  if (!session?.user?.email) {
    return [];
  }
  try {
    const gateUsersIdAndPhoneNumber = await prisma?.gateUser.findMany({
      select: {
      idInApi: true,
      phoneNumber: true,
      }
    }) as GateUsersInfoForDeleteAll[]

    return gateUsersIdAndPhoneNumber
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }


}

export const deleteGateUserFromApi = async (id: string) => {
  const url = 'https://cstat.nextel.com.ua:8443/tracking/contacts/remove';
  const headers: Record<string, string> = {
    Authorization: 'kddHSkpUbPSc',
    ProjectId: '6275',
  };

  const formData = new FormData();
  console.log('id!!!!!!!!!!!!!!!!!', id)
  formData.append('id', id);
  console.log('formData', formData)

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: formData,
  })

  console.log('after delete from api', response)

}


export const deleteGateUserFromDb = async (phoneNumber: string) => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }
  try {

    await prisma?.gateUser.delete({
      where: {
        phoneNumber: phoneNumber,
      }
    }) 

    console.log(`User with phoneNumber: ${phoneNumber} deleted`)
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }
}

export const exportUsersFromDbToFile = async () => {
  const now = moment();

  const session = await getSession();
  if (!session?.user?.email) {
    return [];
  }
  try {
    const gateUsers = await prisma?.gateUser.findMany()
    const jsonData = JSON.stringify(gateUsers, null, 2);
    fs.writeFile(`users-${now.format('YYYY-MM-DD_HH-mm-ss')}.json`, jsonData, (err) => {
      if (err) {
        console.error('Error writing file', err);
      } else {
        console.log('Successfully wrote file');
      }
    });
    // return gateUsersIdAndPhoneNumber
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from Call');
  }


}

export const importUsersFromFileToDb = async () => {
  const session = await getSession();
  if (!session?.user?.email) {
    return [];
  }
  try {
    const data = fs.readFileSync('users-2023-07-09_00-07-16.json', 'utf8');
    const users = JSON.parse(data);

    // for (const user of users) {
    //   await prisma?.gateUser.create({
    //     data: {
    //       id: user.id,
    //       idInApi: user.idInApi,
    //       name: user.name,
    //       phoneNumber: user.phoneNumber,
    //       carNumber: user.carNumber,
    //       apartmentNumber: user.apartmentNumber,
    //       image: user.image,
    //       isBlackListed: user.isBlackListed,
    //       blackListedFrom: user.blackListedFrom,
    //       blackListedTo: user.blackListedTo
    //     },
    //   });
    // }
    return users
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from file');
  }


}

export const importUsersFromFileToDbTest = async (): Promise<GateUserType[]> => {
  const session = await getSession();
  if (!session?.user?.email) {
    return [];
  }
  try {
    const data = fs.readFileSync('user-test.json', 'utf8');
    const users = JSON.parse(data);

    return users
  } catch (error) {
    console.error(error);
    throw new Error('Error receiving data from file');
  }


}