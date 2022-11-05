import ac from "@antiadmin/anticaptchaofficial";
import { AxiosInstance } from "axios";
import { log } from "./log";

// @ts-ignore
ac.settings.comment = "1 letter and 5 digits"

export class AC {
  constructor(api_key: string, private client: AxiosInstance) {
    ac.setAPIKey(api_key);
  }

  private async trySolveImage(img: string, idx: number): Promise<string> {
    try {
      const text = await ac.solveImage(img);

      log(`captcha result: ${text}`);

      if (!!text && !(/^[A-z][0-9]{5}$/.test(text))) {
        const t = await ac.reportIncorrectImageCaptcha();
        // @ts-ignore
        console.log('wrong captcha reported', ac.settings.taskId, t);
        throw new Error("Invalid captcha text");
      }
      return text.toLowerCase();
    }
    catch (e) {
      if(idx < 0) {
        throw e;
      }
      
      log("captcha failed, retrying");

      return await this.trySolveImage(img, idx - 1);
    }
  }

  async solveImage(): Promise<string> {
    const timestamp = Date.now();
    const response = await this.client.get(
      `/ru/Account/CaptchaImage?${timestamp}`,
      {
        responseType: "arraybuffer",
      }
    );

    const img = Buffer.from(response.data).toString("base64");

    return await this.trySolveImage(img, 3);
  }
}
