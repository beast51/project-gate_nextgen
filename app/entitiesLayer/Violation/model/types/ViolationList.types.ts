export type VisitsType = {
  aboutUser: {
    carNumber: string[];
    image?: string;
    apartmentNumber?: string;
    number?: string[]
    name: string;
  };
  violationCount: number;
  visitCount: number;
  visits: {
    thisVisitTime: string;
    timeIn: string;
    timeOut: string;
    violation: string;
    violationTime: number;
  }[];
};

export type ViolationsResponseType = {
  [key: string]: VisitsType;
};