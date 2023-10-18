export const getData = async () => {
  const url = 'https://cstat.nextel.com.ua:8443/tracking/contacts/get';
  const headers = {
    Authorization: 'kddHSkpUbPSc',
    Projectid: '6275',
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