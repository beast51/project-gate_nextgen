import axios from "axios";
import { signIn } from "next-auth/react";
import { FieldValues } from "react-hook-form";
import toast from "react-hot-toast";

export const registerUser = (data: FieldValues) => {
  axios
  .post('/api/register', data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(() => signIn('credentials', data))
  .catch(() => toast.error('Something went wrong'))
}



