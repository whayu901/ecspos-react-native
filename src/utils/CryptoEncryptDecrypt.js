import Base64 from 'crypto-js/enc-base64';
import UTF from 'crypto-js/enc-utf8';
import AES from 'crypto-js/aes';

const key = Base64.parse('B5y8y7mC8t7FiCYMitzFUDJ9y02OHwaDKibrcuYeyY');
const iv = Base64.parse('KoCwu3-rnAtbZ5cEjmH8eEPbAplkHG1q1DV19-AsQUE');

export const useEncrypt = messageToEncrypt => {
  // Selectively encrypt sensitive fields
  let sensitiveData = {
    trialCode: messageToEncrypt.trialCode,
    palmId: messageToEncrypt.palmId,
  };

  let ciphertext = AES.encrypt(JSON.stringify(sensitiveData), key, {
    iv: iv,
  }).toString();

  // Append non-sensitive data in plaintext
  const nonSensitiveData = {...messageToEncrypt};
  delete nonSensitiveData.trialCode;
  delete nonSensitiveData.palmId;

  return JSON.stringify({
    encrypted: ciphertext,
    data: nonSensitiveData,
  });
};

export const useDecrypt = messageToDecrypt => {
  console.log('Attempting to decrypt:', messageToDecrypt);
  try {
    const decryptedBytes = AES.decrypt(messageToDecrypt, key, {iv: iv});
    const decryptedText = decryptedBytes.toString(UTF);
    console.log('Decrypted Text:', decryptedText);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Decryption Error:', error);
    throw new Error('Failed to decrypt data: malformed UTF-8 data');
  }
};
