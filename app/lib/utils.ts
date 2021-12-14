import JSZip from "jszip"
import config from "../config.json"
import CryptoJS from "crypto-js"
const sigUtil = require('@metamask/eth-sig-util')

export function onlyUniqueObjects(array: any[], keyName: string) {
  const uniqueKeys: any[] = []
  return array.filter(item => uniqueKeys.includes(item[keyName]) ? false : uniqueKeys.push(item[keyName]))
}

export function trimHash(hash: string) {
  return hash.slice(0, 5) + '...' + hash.slice(-5)
}

export function strArrayToPhrase(array: string[]) {
  return array.slice(0, -1).join(', ') + ' & ' + array.slice(-1)
}

export function zipFiles(files: File[], folderName: string) {
  if (files.length === 0 || folderName === "") return false
  const zip = new JSZip()
  const folder = zip.folder(folderName)!
  files.forEach(file => {
    folder.file(file.name, file as any)
  })
  return zip.generateAsync({ type: "blob" })
}

export async function unzipFiles(data: Blob) {
  const zip = new JSZip()
  const files = (await zip.loadAsync(data)).files
  return files
}

export async function sendToEstuary(data: Blob, name: string) {
  const formData = new FormData()
  formData.append("data", data, name)

  const request = await fetch(config.estuaryEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.estuaryToken}`,
    },
    body: formData
  })
  return await request.json()
}


export async function unPackIPFS(data: Blob): Promise<{ [key: string]: File }> {
  const jsZipObjects = await unzipFiles(data)
  const fileList = Object.values(jsZipObjects).map(async file => new File([await file.async("blob")], file.name))
  const files = (await Promise.all(fileList)).filter(file => !file.name.endsWith('/'))
  const fileDict = {}
  return files.reduce((obj, item) => (
    { ...obj, [item['name'].split('/')[1]]: item }), fileDict
  )
}

export function trimString(str: string | undefined, maxLength: number) {
  if (str === undefined) return ""
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

export function effectivePrice(price: number, reward: number, tax: number) {
  return parseFloat((price + reward + tax).toPrecision(6))
}


function generateKey() {
  return CryptoJS.lib.WordArray.random(24).toString(CryptoJS.enc.Base64)
}

export function encryptFile(data: Blob): Promise<{
  key: string,
  data: Blob
}> {
  return new Promise((resolve) => {
    var reader = new FileReader()
    reader.onload = () => {
      var key = generateKey()
      var wordArray = CryptoJS.lib.WordArray.create(reader.result as any)
      var encrypted = CryptoJS.AES.encrypt(wordArray, key).toString()
      resolve({
        key: key,
        data: new Blob([encrypted])
      })
    }
    reader.readAsArrayBuffer(data)
  })
}


function convertWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray) {
  var arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : []
  var length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4
  var uInt8Array = new Uint8Array(length), index = 0, word, i
  for (i = 0; i < length; i++) {
    word = arrayOfWords[i]
    uInt8Array[index++] = word >> 24
    uInt8Array[index++] = (word >> 16) & 0xff
    uInt8Array[index++] = (word >> 8) & 0xff
    uInt8Array[index++] = word & 0xff
  }
  return uInt8Array
}


export function decryptFile(data: Blob, key: string): Promise<Blob> {
  return new Promise((resolve) => {
    var reader = new FileReader()
    reader.onload = () => {
      var decrypted = CryptoJS.AES.decrypt(reader.result as any, key)
      var typedArray = convertWordArrayToUint8Array(decrypted)
      resolve(new Blob([typedArray]))
    }
    reader.readAsText(data)
  })
}

export function encryptStr(plainText: string, publicKey: string) {
  const encryptedObj = sigUtil.encrypt({
    publicKey: publicKey,
    data: plainText,
    version: 'x25519-xsalsa20-poly1305'
  })
  const encryptedText = JSON.stringify(encryptedObj)
  return encryptedText
}


export function toDateString(timestamp: number, onlyDate: boolean = false) {
  const date = new Date(timestamp * 1000)
  return (date.toDateString().slice(4) + (onlyDate
    ? ""
    : ' · ' + date.toString().slice(16, 21)
  ))
}