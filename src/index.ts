import fs from "fs";
import axios from "axios";
import { config } from "dotenv";
import { AC } from "./anti-captcha";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar, MemoryCookieStore } from "tough-cookie";
import { Site } from "./site";
import { log } from "./log";
import { TgSendResponse } from "./types";

const cookies = fs.existsSync("./cookie.json") && require("../cookie.json");

const cookieStrorage = new MemoryCookieStore();
const jar = cookies
  ? CookieJar.deserializeSync(cookies, cookieStrorage)
  : new CookieJar(cookieStrorage);
const instance = wrapper(
  axios.create({
    jar,
    baseURL: "https://q.midpass.ru",
  })
);

config();

const AC_TOKEN = process.env.AC_TOKEN;
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

if (!AC_TOKEN) {
  throw new Error("AC_TOKEN is not defined");
}

const ac = new AC(AC_TOKEN, instance);
const site = new Site(instance, cookieStrorage, ac);

// 'Привет красафчик это просто тестовое\n *сообщение*'
export const sendTelegramMessage = async (text : any) => {
  const res = await axios.get<TgSendResponse>(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${TG_CHAT_ID}&parse_mode=MarkdownV2&text=${encodeURI(text.replace(/([()\-])/g, '\\$1'))}`);
  return res.data.ok;
}

const checkLastRun = () => {
  const LASTRUN_FILENAME = './lastrun';

  if (fs.existsSync(LASTRUN_FILENAME)) {
    const content = fs.readFileSync(LASTRUN_FILENAME, 'utf8');
    if (Date.now() - parseInt(content) < 1000 * 3600 * 4 + 60000 * 2) {
      throw new Error('Last run was less than 4 hours ago, exiting');
    }
  }
  
  fs.writeFileSync(LASTRUN_FILENAME, ''+Date.now());
}

const main = async () => {
  if (process.env.DISABLED) {
    console.log('DISABLED');
    return;
  }
  checkLastRun();

  const logged = await site.login(process.env.EMAIL!, process.env.PASSWORD!);
  console.log('is Logged: ', logged);
  if (!logged) {
    await sendTelegramMessage(`*ВНИМАНИЕ*: Проблема с логином!`);
    throw new Error('Cannot login');
  }
  log(jar.toJSON());

  // const schedule = await site.getMonthSchedule();
  // if(schedule.AvailableSlots > 0){
  //   log(schedule);
  // }

  const schedules = await site.findAppointments();
  if (schedules.Items?.length > 1){
    log(schedules, 'SHED');
    const sendedTg = await sendTelegramMessage(`*ВНИМАНИЕ*: Появилась запись на прием!`);
    log(`${ sendedTg ? 'Sent' : 'Failed to send' } message about new appointments`);
  }

  const waitingList = await site.getWaitingList();
  log(waitingList, 'LIST');

  if (waitingList?.Items?.length === 0) {
    throw new Error("You have no appointments");
  }

  for (let appointment of waitingList.Items) {
    const text = `Запись в листе ожидания:\n*${appointment.ServiceName}*\n\n`
        + `Очередь: *${appointment.PlaceInQueue}*\n`
        + `Можно обновить: *${appointment.CanConfirm ? 'Да' : 'Нет'}*`;
    const sendedTg = await sendTelegramMessage(text);
    log(`${ sendedTg ? 'Sent' : 'Failed to send' } message about waiting shedule ${appointment.ServiceName}`);

    if (!!appointment.CanConfirm) {
      const confirmation = await site.confirmWaitingAppointments(appointment.Id);
      if (!confirmation.IsSuccessful) {
        throw new Error(`${confirmation.ErrorMessage}`);
      } else {
        log("Appointment confirmed", appointment.Id);
        await sendTelegramMessage('Успешное подтверждение очереди.');
      }
    } else {
      log("You can't confirm this appointment");
    }
  }
};

main().catch(err => log(err.message));

// test purposes
// const timer = setInterval(() => {
//   main().catch(err => log(err.message));
// }, 1000 * 45 * 2);

const timer = setInterval(() => {
  main().catch(err => log(err.message));
}, 1000 * 60 * 5);