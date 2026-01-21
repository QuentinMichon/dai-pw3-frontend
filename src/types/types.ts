export type Aircraft = {
    constructor: string;
    ICAO: string;
    range: number;
    maxCapacity: number;
};

export type Company_t = {
    companyICAO: string;
    name: string;
    country: string;
    fleet: AircraftTuple_t[];
}

export type AircraftTuple_t = {
    aircraftICAO: string;
    quantity: number;
}