import moment from 'moment';

export const log = (message: any, type: any = '') => {
  console.log(`[${moment().format("DD.MM.yyyy HH:mm:ss")}${type ? (':' + type) : ''}] ${JSON.stringify(message, null, 2)}`);
}