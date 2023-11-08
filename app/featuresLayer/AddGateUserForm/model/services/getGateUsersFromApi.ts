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
export type getGateUsersFromApiType = (phoneNumber?: string, name?: string) => Promise<GateUserType[]>

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

export const getGateUsersFromApi: getGateUsersFromApiType = async (phoneNumber = "", name = "") => {
  const url = `${process.env.UNITALK_URL}/contacts/get`;
  const headers: Record<string, string> = {
    Authorization: process.env.UNITALK_AUTHORIZATION!,
    ProjectId: process.env.UNITALK_PROJECT_ID!,
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