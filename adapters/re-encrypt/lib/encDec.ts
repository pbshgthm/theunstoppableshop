import { encrypt } from "./encryption"
const sigUtil = require('@metamask/eth-sig-util')

export function decryptStr(encryptedText: string, privateKey: string) {

  const encryptedObj = JSON.parse(encryptedText)
  const decryptedString = sigUtil.decrypt(
    {
      encryptedData: encryptedObj,
      privateKey: privateKey,
    }
  )
  return decryptedString
}

export function encryptStr(plainText: string, publicKey: string) {

  const encryptedObj = sigUtil.encrypt({
    publicKey: publicKey,
    data: plainText,
    version: 'x25519-xsalsa20-poly1305'
  })
  const encryptedText = Buffer.from(JSON.stringify(encryptedObj)).toString()
  return encryptedText
}

export function encryptConst(plainText: string, publicKey: string) {

  const encryptedObj = encrypt({
    publicKey: publicKey,
    data: plainText,
    version: 'x25519-xsalsa20-poly1305'
  })
  console.log(encryptedObj)
  return encryptedObj.ciphertext
}

