import moment from "moment";
import { formatTime } from "./date";

export const isTimeToRemoveFromBlackList = (time: string | undefined) => {
  if (!time) return false
  const DATE_AND_TIME_NOW = formatTime(Date.now(), false).toString();
  const date1 = moment(time, 'YYYY-MM-DD HH:mm:ss');
  const date2 = moment(DATE_AND_TIME_NOW, 'YYYY-MM-DD HH:mm:ss');
  const diffMinutes = date2.diff(date1, 'minutes');
  return diffMinutes > 1;
};

export const getTimeToUnblock = (time: string) => {
  if (!time) return null;

  const DATE_AND_TIME_NOW = formatTime(Date.now(), false).toString();
  const date1 = moment(time, 'YYYY-MM-DD HH:mm:ss');
  const date2 = moment(DATE_AND_TIME_NOW, 'YYYY-MM-DD HH:mm:ss');
  const diffMinutes = date2.diff(date1, 'minutes');
  const diffHours = date2.diff(date1, 'hours');
  const diffDays = date2.diff(date1, 'days');

  if (diffMinutes > 1) return null;
  if (-diffMinutes > 1440) return `${-diffDays} д.`;
  if (-diffMinutes < 1440 && -diffMinutes > 60) return `${-diffHours} ч.`;
  return `${-diffMinutes} хв.`;
};

