import getSession from "@/widgetsLayer/Sidebar/actions/getSession"

export const addGateUserToApi = async (body: {
  name?: string
  phoneNumber: string
  carNumber: string
  apartmentNumber: string
}) => {
  const session = await getSession();
  const isDemo = session?.user?.name === 'spectator'
  const CAN_OPEN_GATES = process.env.UNITALK_CAN_OPEN_GATES;
  const CAN_OPEN_DEMO_GATES = process.env.DEMO_UNITALK_CAN_OPEN_GATES;
  const url = `${process.env.UNITALK_URL}/contacts/set`;
  const headers: Record<string, string> = {
    Authorization: process.env.UNITALK_AUTHORIZATION!,
    ProjectId: isDemo ? process.env.DEMO_UNITALK_PROJECT_ID! : process.env.UNITALK_PROJECT_ID!,
    'Content-Type': 'application/json',
  };
  const payload = { 
    "address": body.apartmentNumber,  
    "email": '',  
    "name": body.name,
    "note": body.carNumber.toUpperCase(),
    'phones': [body.phoneNumber],
    "responsible": isDemo ? CAN_OPEN_DEMO_GATES : CAN_OPEN_GATES, 
  };
console.log('add user with data: ', payload)
console.log('headers', headers)

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    const data = await response.json();
    // Обработка полученных данных
   console.log( data)
  } else {
    // Обработка ошибки запроса
    throw new Error('Network response was not ok.');
  }

}