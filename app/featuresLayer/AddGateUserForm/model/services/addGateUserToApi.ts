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

}