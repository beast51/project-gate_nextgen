import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.UNITALK_URL!,
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  }
});