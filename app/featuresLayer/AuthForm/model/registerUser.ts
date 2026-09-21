import { RegisterRequest } from "@/contracts";
import { api } from "@/sharedLayer/api";
import { signIn } from "next-auth/react";
import { FieldValues } from "react-hook-form";
import toast from "react-hot-toast";

export const registerUser = (data: FieldValues) => {
  api
  .register(data as RegisterRequest)
  .then(() => signIn('credentials', data))
  .catch(() => toast.error('Something went wrong'))
}



