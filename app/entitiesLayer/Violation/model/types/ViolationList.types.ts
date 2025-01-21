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

export type ViolationType = {
  name: string
  number: string
  time: {
    from: string, 
    to: string, 
    violationTime: string,  
    dateOfViolation: string
  }[]
}

export type violationsListType = {
  time: string[],
  details: {
    carNumber: string[],
    image?: string | null,
    apartmentNumber?: string | null,
    name?: string | null
  } | null
}

export type CallDetails = {
  carNumber: string[];
  image?: string | null;
  number: string[];
  name?: string | null;
};

export type newViolationsListType = {
  time: string[];
  details: CallDetails | null;
};

export type FindViolationsType = (from: string | undefined , to: string | undefined) => Promise<ViolationType[]>
export type VisitInfo = {
  timeIn: string;
  timeOut: Date | string | null ;
  thisVisitTime: number | null;
  violationTime: number | null;
  violation: string;
};

export type VisitDetails = {
  visitCount: number;
  violationCount: number;
  visits: VisitInfo[];
  aboutUser: {
    carNumber: string | null,
    image?: string | null,
    apartmentNumber?: string | null,
    name?: string | null
  } | {}
};

export type VisitsInput = {
  [phone: string]: violationsListType;
};

export type VisitsOutput = {
  [phone: string]: VisitDetails;
};