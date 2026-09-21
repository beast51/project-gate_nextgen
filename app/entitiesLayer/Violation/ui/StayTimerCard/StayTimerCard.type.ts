import { VisitsType } from "../../model/types/ViolationList.types";

export type StayTimerCardProps = {
  isOverstay?: boolean;
  // what a visit without an exit is called; '?' on the list of a day, where it may still be closed
  openLabel?: string;
  visit: VisitsType['visits'][0];
};