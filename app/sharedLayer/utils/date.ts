import moment from "moment";

export const formatTime = (timestamp: number, startOfTheDay = false) => {
  const date = moment(timestamp);
  return  startOfTheDay ? date.format('YYYY-MM-DD 00:00:00') : date.format('YYYY-MM-DD HH:mm:ss');
}

export const parseTime = (time: string) => {
  const date = moment(time, 'YYYY-MM-DD HH:mm:ss');
  return date.valueOf();
}