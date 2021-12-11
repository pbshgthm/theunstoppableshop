import { useCallback, useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { onlyUniqueObjects } from "../lib/utils"


export function FileUpload({ files, onlyImages, maxFiles = 20, setFiles }: {
  files?: File[],
  onlyImages?: boolean,
  maxFiles?: number,
  setFiles: (files: File[]) => void
}) {
  const [currFiles, setCurrFiles] = useState<File[]>(files || [])
  const [uploadMsg, setUploadMsg] = useState<string>("Drop files here or click to upload")

  useEffect(() => {
    if (files) {
      setCurrFiles(files)
    }
  }, [files])
  const onDrop = useCallback(newFiles => {
    setCurrFiles(onlyUniqueObjects([...currFiles, ...newFiles].slice(-1 * maxFiles), 'name'))
  }, [currFiles, maxFiles])

  const dropZoneConfig: any = { onDrop, maxFiles }

  if (onlyImages) {
    dropZoneConfig.accept = 'image/*'
  }

  if (currFiles.length > maxFiles) {
    dropZoneConfig.accept = null
  }

  const { getRootProps, getInputProps, isDragActive, isDragAccept,
    isDragReject } = useDropzone(dropZoneConfig)

  useEffect(() => {
    if (isDragAccept) setUploadMsg('Drop file to upload')
    if (isDragReject) setUploadMsg('Invalid file type / max file size exceeded')
    if (!isDragActive) setUploadMsg('Drop files here or click to upload')
  }, [isDragActive, isDragReject, isDragAccept])

  useEffect(() => {
    setFiles(currFiles)
  }, [currFiles, setFiles])

  return (
    <div>
      <div {...getRootProps()} className="mt-2 w-96 border-dashed border-2 rounded cursor-pointer hover:bg-gray-50">
        <div className="text-gray-400 text-sm text-center p-12">
          {uploadMsg}
        </div>
        <input {...getInputProps()} />
      </div>
    </div>
  )
}