export const deleteGateUserFromApi = async (id: string) => {
  const url = `${process.env.UNITALK_URL}/contacts/remove`;
  const headers: Record<string, string> = {
    Authorization: `${process.env.UNITALK_AUTHORIZATION}`,
    ProjectId: `${process.env.UNITALK_PROJECT_ID}`,
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