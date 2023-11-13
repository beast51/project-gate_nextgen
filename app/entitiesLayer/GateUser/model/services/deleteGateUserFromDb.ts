import getSession from "@/widgetsLayer/Sidebar/actions/getSession";

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