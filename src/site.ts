import { AxiosInstance } from "axios";
import { stringify } from "querystring";
import { MemoryCookieStore, Cookie } from "tough-cookie";
import { AC } from "./anti-captcha";
import { log } from "./log";
import {
  Confirmation,
  FindAppointmentsResponse,
  // MonthScheduleResponse,
  // SheduledAppointment,
  WaitingAppointments
} from './types'

export class Site {
  constructor(
    private client: AxiosInstance, 
    private cookieStorage: MemoryCookieStore,
    private ac: AC
  ) {}

  private async tryLogin(username: string, password: string, idx: number): Promise<any> {

    const payload = {
      NeedShowBlockWithServiceProviderAndCountry: "True",
      CountryId: "253ca433-0ff2-93c3-889f-6e7a0824b13e",
      ServiceProviderId: "674696fb-6dcd-0970-3320-aff714dab43d",
      Email: username,
      "g-recaptcha-response": "",
      Captcha: await this.ac.solveImage(),
      Password: password,
    };

    await this.client.post(
      "/ru/Account/DoPrivatePersonLogOn",
      stringify(payload)
    );

    const sessionCookie = await this.getSessionCookie();

    const retries = idx - 1;

    if (!sessionCookie && retries === 0) {
      console.log("Login failed");
      return false;
    }

    if (!sessionCookie) {
      log(`Login failed, retrying - ${idx}`);
      return await this.tryLogin(username, password, retries);
    }

    return true;
  };

  async login(username: string, password: string) {
    let sessionCookie = await this.getSessionCookie();

    // get initial cookies
    const check = await this.client.get("/");

    console.log('check', check?.status);
    console.log('cookie', sessionCookie);

    if (sessionCookie) {
      log("Session cookie is already set");
      return true;
    }

    return await this.tryLogin(username, password, 3);
  };

  private getSessionCookie = (): Promise<Cookie | null> => new Promise((resolve, reject) => {
    this.cookieStorage.findCookie("q.midpass.ru", "/", ".ASPXAUTH", (err, cookie) => {
      if (err) {
        return reject(err);
      }
      resolve(cookie);
    });
  });

  async getWaitingList () {
    const payload = {
      begin: 0,
      end: 10
    }
    const response = await this.client.post<WaitingAppointments>("/ru/Appointments/FindWaitingAppointments", stringify(payload));
    return response.data;
  };

  async confirmWaitingAppointments(id: string){
    const payload = {
      ids: id,
      captcha: await this.ac.solveImage()
    }
    const response = await this.client.post<Confirmation>("/ru/Appointments/ConfirmWaitingAppointments", stringify(payload));
    return response.data;
  };

  async findAppointments() {
    const payload = {
      dateFromString: "",
      dateToString: "",
      contactInfo: "",
      serviceProviderId: "",
      serviceId: "",
      appointmentStatus: 0,
      email: "",
      begin: 0,
      end: 10,
      grouping: "",
      windowNumber: ""
    }
    const response = await this.client.post<FindAppointmentsResponse>("/ru/Appointments/FindAppointments", stringify(payload));
    return response.data;
  };

  // unused part
  // async getMonthSchedule() {
  //   const payload = {
  //     serviceId: "d48adb92-4e7b-4b4d-a00a-fb84c40822d5",
  //     month: 11,
  //     year: 2022,
  //     day:1,
  //     k:7431
  //   }
  //   const response = await this.client.post<MonthScheduleResponse>("/ru/Booking/GetMonthSchedule", stringify(payload));
  //   return response.data;
  // };
}
