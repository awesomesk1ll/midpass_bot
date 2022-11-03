// Запись из раздела Лист ожидания
export interface WaitingAppointment {
  WaitingAppointmentId: string,
  PlaceInQueue: number,
  PlaceInQueueString: string,
  CanConfirm: boolean,
  CanCancel: boolean,
  Id: string,
  Email: string,
  FullName: string,
  PhoneNumber: string,
  ScheduledDateTimeString: string,
  ApplicantId: string,
  ServiceProviderCode: string,
  ServiceId: string,
  ServiceName: string,
  ServiceAlternativeName: string,
  Payload: string
}

// Раздел Лист ожидания
export interface WaitingAppointments {
  Items: WaitingAppointment[],
  Count: number
}

export interface Confirmation {
  ErrorMessage: string | null,
  IsSuccessful: boolean,
}

export interface MonthScheduleDay {
    Date: string,
    ScheduledAppointmentsCount: number,
    ApplicationsDailyLimit: number,
    BlockedByMeCount: number,
    AvailableAppointmentsCount: number
}

export interface MonthScheduleMonth {
  Days: MonthScheduleDay[],
  Month: number,
  Year: number
}

export interface MonthScheduleResponse {
  Error: string | null,
  ServiceId: string,
  Month: MonthScheduleMonth,
  TotalSlots: number,
  AvailableSlots: number,
  ReserevedByYouCount: number,
}

// Запись из раздела Записи
export interface SheduledAppointment {
  ApplicantId: string,
  CanCancel: boolean,
  CanConfirm: boolean,
  Email: string,
  FullName: string,
  Id: string,
  Payload: string
  PhoneNumber: string,
  AppointmentDateTimeString: string,
  ServiceAlternativeName: string,
  ServiceId: string,
  ServiceName: string,
  ServiceProviderCode: string,
  WaitingAppointmentId: string,
  StatusChangeDateTimeString: string,
  Status: number,
  WindowNumber: number,
}

// Раздел записи
export interface FindAppointmentsResponse {
  Items: SheduledAppointment[],
  FileGuid: string,
  Count: number
}

export interface TgSendResponse {
  ok: boolean
}
