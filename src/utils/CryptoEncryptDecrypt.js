import Base64 from 'crypto-js/enc-base64';
import UTF from 'crypto-js/enc-utf8';

var AES = require('crypto-js/aes');

const key = Base64.parse('B5y8y7mC8t7FiCYMitzFUDJ9y02OHwaDKibrcuYeyY');
const iv = Base64.parse('KoCwu3-rnAtbZ5cEjmH8eEPbAplkHG1q1DV19-AsQUE');

export const useEncrypt = messageToEncrypt => {
  let ciphertext = AES.encrypt(JSON.stringify(messageToEncrypt), key, {
    iv: iv,
  }).toString();

  return ciphertext;
};

export const useDecrypt = messageToDecrypt => {
  console.log(
    '~ file: CryptoJsEncryptDecrypt.js ~ line 18 ~ useDecrypt ~ messageToDecrypt',
    messageToDecrypt,
  );
  const decryptedValue = AES.decrypt(messageToDecrypt, key, {
    iv: iv,
  }).toString(UTF);
  console.log(
    '~ file: CryptoJsEncryptDecrypt.js ~ line 22 ~ useDecrypt ~ decryptedValue',
    decryptedValue,
  );

  return decryptedValue;
};
