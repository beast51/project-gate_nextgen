import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: 'https://cstat.nextel.com.ua:8443/tracking/',
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  }
});