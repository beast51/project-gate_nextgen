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