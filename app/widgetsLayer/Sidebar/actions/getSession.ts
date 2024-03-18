
import { authOptions } from "@/appLayer/libs/authOptions";
import { getServerSession } from "next-auth";

export default async function getSession() {
  return await getServerSession(authOptions);
}