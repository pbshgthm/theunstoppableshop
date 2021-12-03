import JSZip from "jszip"
import saveAs from "file-saver"
import { useCallback, useState } from "react"
import { useDropzone } from 'react-dropzone'
import { onlyUniqueObjects } from "../lib/utils"
import CryptoJS from "crypto-js"


interface File extends Blob {
  name: string,
  path: string,
}

function generateKey() {
  return CryptoJS.lib.WordArray.random(24).toString(CryptoJS.enc.Base64)
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

function encryptFile(data: Blob): Promise<{
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

function decryptFile(data: Blob, key: string): Promise<Blob> {
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

function zipFiles(files: File[], folderName: string) {
  //doesnt preserve folder structure
  if (files.length === 0 || folderName === "") return false
  const zip = new JSZip()
  const folder = zip.folder(folderName)!
  files.forEach(file => {
    folder.file(file.name, file as any)
  })
  return zip.generateAsync({ type: "blob" })
}

function LockFile() {

  const [files, setFiles] = useState<File[]>([])
  const [fileSize, setFileSize] = useState<number>(0)
  const [license, setLicense] = useState<string>("")

  const onDrop = useCallback(newFiles => {
    setFiles(onlyUniqueObjects([...files, ...newFiles], 'name'))
    let byteSize = 0
    newFiles.forEach((file: File) => { byteSize += file.size })
    setFileSize(byteSize)
  }, [files])

  async function lockFile() {
    const folderName = 'stuff'
    const zipped = await zipFiles(files, folderName)
    if (zipped) {
      const { data: encrypted, key } = await encryptFile(zipped)
      saveAs(encrypted, `${folderName}.enc`)
      setLicense(key)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div className="mt-5">
      <div className="text-gray-600 mb-8">Seller</div>
      <div {...getRootProps()} className="w-96 h-24 bg-gray-100 p-5 rounded text-gray-500">
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the files here ...</p> :
            <p>Drag n drop some files here, or click to select files</p>
        }
      </div>
      <div className="mt-3 text-gray-700">
        {Math.round(fileSize / 1024)} kb
      </div>
      <div>
        <input type="text" className="py-2 px-4 bg-gray-100 text-sm focus:outline-none my-2 rounded w-full" value={license} disabled></input>
      </div>
      <button onClick={lockFile}>Download</button>
      <div>-------------</div>
      <div className="mt-3 text-gray-700 flex flex-col gap-1">
        {files.map((file: File) => (<div key={file.name}>{file.path}</div>))}
      </div>
    </div>
  )
}

function UnLockFile() {

  const [file, setFile] = useState<File>()
  const [fileSize, setFileSize] = useState<number>(0)
  const [license, setLicense] = useState<string>()

  const onDrop = useCallback(newFiles => {
    setFile(newFiles[0])
    const byteSize = file?.size || 0
    setFileSize(byteSize)
  }, [file])

  async function unLockFile() {
    const folderName = 'stuff'
    if (file && license) {
      const blob = new Blob([file as any])
      const decrypted = await decryptFile(blob, license)
      saveAs(decrypted, `${folderName}.zip`)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div className="mt-5">
      <div className="text-gray-600 mb-8">Buyer</div>
      <div {...getRootProps()} className="w-96 h-24 bg-gray-100 p-5 rounded text-gray-500">
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the files here ...</p> :
            <p>Drag n drop some files here, or click to select files</p>
        }
      </div>
      <div className="mt-3 text-gray-700">
        {Math.round(fileSize / 1024)} kb
      </div>
      <div>
        <input type="text" className="py-2 px-4 bg-gray-100 text-sm focus:outline-none my-2 rounded w-full" onChange={(e) => setLicense(e.target.value)}></input>
      </div>
      <button onClick={unLockFile}>Download</button>
      <div>-------------</div>
      <div className="mt-3 text-gray-700 flex flex-col gap-1">
        {file?.path}
      </div>
    </div>
  )
}

export default function FileHandle() {
  return (
    <div className="p-12 flex flex-row gap-48">
      <LockFile />
      <UnLockFile />
    </div>
  )
}

