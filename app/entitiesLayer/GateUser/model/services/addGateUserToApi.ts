export const addGateUserToApi = async (body: {
  name?: string
  phoneNumber: string
  carNumber: string
  apartmentNumber: string
}) => {
  const CAN_OPEN_GATES = process.env.UNITALK_CAN_OPEN_GATES;
  const url = `${process.env.UNITALK_URL}/contacts/set`;
  const headers: Record<string, string> = {
    Authorization: process.env.UNITALK_AUTHORIZATION!,
    ProjectId: process.env.UNITALK_PROJECT_ID!,
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
console.log('add user with data: ', payload)

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  })

}