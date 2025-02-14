import CryptoJS from "crypto-js";

export interface UserPermission {
  overlayMark: string[];
  backTestTime: number;
  stockPoolNum: number;
  stockPickGroup: string[];
  stockPickMaxTime: number;
  stockPickMaxList: number;
  alarmMark: boolean;
  alarmEmail: boolean;
  textLive: boolean;
  vcomment: boolean;
  chat: boolean;
}
export const parsePermission = (permission: string) => {
  // 从 PHP 加密结果中获取的 Base64 编码的密文
  // 从 PHP 中获取的 Base64 编码的初始向量（IV）
  const ivBase64 = "XHWzakbP1mH5nBPM";
  // 与 PHP 中使用的相同的密钥，长度为 16 字节（128 位）
  const key = CryptoJS.enc.Utf8.parse("CTz381iS3cs0JfGeFmiMzMh5YaQTTae9");

  // 将 Base64 编码的 IV 转换为 WordArray 对象
  const iv = CryptoJS.enc.Utf8.parse(ivBase64);

  // 解密
  const decrypted = CryptoJS.AES.decrypt(permission, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 获取解密后的明文
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

  let result: UserPermission = {
    overlayMark: [],
    backTestTime: 0,
    stockPoolNum: 0,
    stockPickGroup: [],
    stockPickMaxTime: 0,
    stockPickMaxList: 0,
    alarmMark: false,
    alarmEmail: false,
    textLive: false,
    vcomment: false,
    chat: false,
  };

  try {
    result = JSON.parse(plaintext);
  } catch (er) {}

  return result;
};
