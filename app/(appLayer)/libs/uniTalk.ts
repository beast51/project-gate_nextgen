export const getData = async () => {
  const url = `${process.env.UNITALK_URL!}contacts/get`;
  const headers = {
    Authorization: process.env.UNITALK_AUTHORIZATION!,
    Projectid: process.env.UNITALK_PROJECT_ID!,
    'Content-Type': 'application/json',
  };
  const payload = { limit: 50, offset: 0 };
  const result = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }

  return result.json();
};