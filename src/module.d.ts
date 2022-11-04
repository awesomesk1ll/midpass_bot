declare module '@antiadmin/anticaptchaofficial' {
  export function solveImage(body: string): Promise<string>;
  export function reportIncorrectImageCaptcha(): Promise<any>;
  export function setAPIKey(key: string): void;
}