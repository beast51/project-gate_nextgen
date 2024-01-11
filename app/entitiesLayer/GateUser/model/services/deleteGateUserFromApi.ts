import getSession from "@/widgetsLayer/Sidebar/actions/getSession";

export const deleteGateUserFromApi = async (id: string) => {
  const session = await getSession();
  const isDemo = session?.user?.name === 'spectator'
  const url = `${process.env.UNITALK_URL}/contacts/remove`;
  const headers: Record<string, string> = {
    Authorization: `${process.env.UNITALK_AUTHORIZATION}`,
    ProjectId: isDemo ? process.env.DEMO_UNITALK_PROJECT_ID! : process.env.UNITALK_PROJECT_ID!,
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