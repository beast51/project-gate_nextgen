import { RegisterRequest } from "@/contracts";
import { api } from "@/sharedLayer/api";
import { PhoneCredentials, signInWithPhone } from "@/sharedLayer/framework/session";
import { FieldValues } from "react-hook-form";
import toast from "react-hot-toast";

export const registerUser = (data: FieldValues) => {
  api
  .register(data as RegisterRequest)
  .then(() => signInWithPhone(data as PhoneCredentials))
  .catch(() => toast.error('Something went wrong'))
}



