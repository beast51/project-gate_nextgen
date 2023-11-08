import { VisitsType } from "../../model/types/ViolationList.types";

export type StayTimerCardProps = {
  isOverstay?: boolean;
  visit: VisitsType['visits'][0];
};