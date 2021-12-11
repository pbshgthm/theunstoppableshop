import { saveAs } from "file-saver"
import JSZip, { JSZipObject } from "jszip"
import { useCallback, useEffect, useState } from "react"
import { useDropzone } from 'react-dropzone'
import { onlyUniqueObjects } from "../lib/utils"
import Image from 'next/image'

interface File extends Blob {
  name: string
}

function Details({ setDetails }: { setDetails: (details: any) => void }) {
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [price, setPrice] = useState<number>(0)

  useEffect(() => {
    setDetails({
      title,
      description,
      price,
    })
  }, [title, description, price])

  const tagList = ['Book', 'Photograph', 'Music', 'Video', 'Art', 'Craft', 'Other']
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 w-96">
        <div className="text-xs text-gray-400">PRODUCT NAME</div>
        <input onChange={(e) => setTitle(e.target.value)} className="bg-gray-100 py-2 px-4 text-gray-600 rounded focus:outline-none" />
      </div>
      <div className="flex flex-col gap-2 w-96">
        <div className="text-xs text-gray-400">PRODUCT DESCRIPTION</div>
        <textarea onChange={(e) => setDescription(e.target.value)} className="bg-gray-100 py-2 px-4 text-gray-600 rounded focus:outline-none h-36" />
      </div>
      <div className="flex flex-col gap-2 w-96">
        <div className="text-xs text-gray-400">PRICE</div>
        <input onChange={(e) => setPrice(parseInt(e.target.value))} className="bg-gray-100 py-2 px-4 text-gray-600 rounded focus:outline-none" />
      </div>
    </div>
  )
}


function zipFiles(files: File[], folderName: string) {
  // doesnt preserve folder structure
  if (files.length === 0 || folderName === "") return false
  const zip = new JSZip()
  const folder = zip.folder(folderName)!
  files.forEach(file => {
    folder.file(file.name, file as any)
  })
  return zip.generateAsync({ type: "blob" })
}

async function sendToEstuary(data: Blob) {
  const formData = new FormData()
  formData.append("data", data, "details.zip")

  const request = await fetch('https://shuttle-4.estuary.tech/content/add', {
    method: "POST",
    headers: {
      Authorization: 'Bearer EST98d089e8-9712-4450-abc4-d23fd28a6cbfARY',
      //NEED TO REVOKE AFTER TESTING
    },
    body: formData
  })
  return await request.json()
}

function getFromIPFS(cid: string) {
  return fetch(`https://cloudflare-ipfs.com/ipfs/${cid}`)
}

async function unzip(data: Blob) {
  const zip = new JSZip()
  const files = await (await zip.loadAsync(data)).files
  return files
}



function Render() {
  const [cid, setCID] = useState<string>('')
  const [files, setFiles] = useState<{ [key: string]: JSZipObject }>({})
  const [details, setDetails] = useState<any>({})

  useEffect(() => {
    async function getData() {
      try {
        const details = await files['details/data.json'].async("text")
        if (details) {
          setDetails(JSON.parse(details))
        }
      } catch (e) {
        //console.log(e)
      }
    }
    getData()
  }, [files])

  async function getFiles() {
    const response = await getFromIPFS(cid)
    const unzipped = await unzip(await response.blob())
    setFiles(unzipped)
  }

  function RenderImg({ fileName }: { fileName: string }) {

    const [img, setImg] = useState<string>('')
    console.log(img)
    useEffect(() => {
      async function getImg() {
        const img = await files['details/' + fileName].async("base64")
        if (img) {
          setImg(img)
        }
      }
      getImg()

    }, [])


    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`data:image/png;base64,${img}`} className="w-full h-auto" alt="" />
    )
  }

  return (
    <div className="p-5 w-96">
      <div>
        <div className="text-xs text-gray-400">CID</div>
        <input type="text" className="py-2 px-4 bg-gray-100 text-sm focus:outline-none my-2 rounded w-full" onChange={(e) => setCID(e.target.value)}></input>
      </div>
      <button className="p-2 bg-blue-100 rounded mr-4" onClick={getFiles}>Render</button>
      <div>
        <pre>
          {JSON.stringify(details, null, 2)}
        </pre>
        {details && details.files &&
          <div>
            {details.files.map((fileName: string) => (
              <RenderImg fileName={fileName} key={fileName} />
            ))}
          </div>
        }
      </div>
    </div>
  )
}

function AddDetails() {
  const [files, setFiles] = useState<File[]>([])
  const [details, setDetails] = useState<any>({})
  const [cid, setCID] = useState<string>("")

  const onDrop = useCallback(newFiles => {
    setFiles(onlyUniqueObjects([...files, ...newFiles], 'name'))
  }, [files])
  const { getRootProps, getInputProps, isDragActive, isDragAccept,
    isDragReject } = useDropzone({
      onDrop,
      accept: 'image/jpeg, image/png'
    })


  async function onSubmit() {
    const detailsJson = { ...details, files: files.map(file => file.name) }
    const detailsFile = new File([JSON.stringify(detailsJson)], "data.json")
    const allFiles = [...files, detailsFile]
    const zipped = await zipFiles(allFiles, "details")
    if (zipped) {
      //saveAs(zipped, 'details.zip')
      const response = await sendToEstuary(zipped)
      setCID(response.cid)
    }
  }

  return (
    <div className="p-5">
      <div>
        <div className="text-xs text-gray-400">CID</div>
        <input type="text" className="py-2 px-4 bg-gray-100 text-sm focus:outline-none my-2 rounded w-96" value={cid} disabled></input>
      </div>
      <Details setDetails={setDetails} />
      <div className="text-xs text-gray-400 mt-12">PREVIEW IMAGES</div>
      <div {...getRootProps()} className="mt-2 w-96 h-24 bg-gray-100 p-5 rounded text-gray-500">
        <input {...getInputProps()} />
        {isDragAccept && (<p>All files will be accepted</p>)}
        {isDragReject && (<p>Some files will be rejected</p>)}
        {!isDragActive && (<p>Drop some files here ...</p>)}
      </div>
      <div>-------------</div>
      <div className="mt-3 text-gray-700 flex flex-col gap-1">
        {files.map((file: File) => (<div key={file.name}>{file.name}</div>))}
      </div>
      <button className="p-2 bg-blue-100 rounded mr-4" onClick={onSubmit}>Save</button>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex flex-row gap-48">
      <AddDetails />
      <Render />
    </div>
  )
}