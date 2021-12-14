import { useMetaMask } from "metamask-react"
import { useEffect, useState } from "react"
import { IBeneficiary } from "../lib/types"


function onlyPercent(input: string,) {
  const num = input.replace(/[^0-9]/g, '')
  return num === '100' ? parseInt(num) : parseInt(num.slice(0, 2)) || 0
}

function onlyNumber(input: string, isDecimal: boolean) {
  const num = input.replace(/[^0-9.]/g, '')
  return isDecimal ? num : num.replace(/\./g, '')
}

function onlyAlphabets(input: string) {
  return input.replace(/[^a-zA-Z]/g, '')
}

export function TextInput({ placeholder, setValue, value, isDisabled, isAlpha }: {
  placeholder: string,
  setValue: (value: string) => void,
  value?: string,
  isDisabled?: boolean,
  isAlpha?: boolean
}) {

  const [currValue, setCurrValue] = useState(value || '')

  useEffect(() => {
    setValue(currValue)
  }, [currValue, setValue])

  return (
    <div>
      <input
        type="text"
        placeholder={placeholder}
        value={currValue}
        disabled={isDisabled}
        onChange={(e) => {
          setCurrValue(isAlpha ? onlyAlphabets(e.target.value) : e.target.value)
        }}
        className="block w-96 p-2 h-10 text-sm rounded-md outline-none bg-white border"
      />
    </div>
  )
}


export function BenificiaryInput({ setValue, benificiary, isDisabled, isOwner }: {
  setValue: (value: IBeneficiary) => void,
  benificiary?: IBeneficiary,
  isDisabled?: boolean
  isOwner?: boolean
}) {

  const { account } = useMetaMask()
  const [currAddress, setCurrAddress] = useState<string>(benificiary?.address || '')
  const [currShare, setCurrShare] = useState<number>(benificiary?.share || 0)

  useEffect(() => {
    if (isOwner && account) {
      setCurrAddress(account)
      setCurrShare(100)
    }
  }, [account, isOwner])

  useEffect(() => {
    setValue({
      address: currAddress,
      share: currShare
    })
  }, [currAddress, currShare, setValue])

  return (
    <div className="-ml-3">
      <input
        type="text"
        placeholder='0x0000000000000000000000000000000000000000'
        value={currAddress.toString()}
        disabled={isDisabled}
        onChange={(e) => { setCurrAddress(e.target.value) }}
        className="block w-80 rounded-r-none border-r-0 p-2 h-10 text-sm rounded-md outline-none bg-white border"
      />
      <input
        type="text"
        disabled={isDisabled}
        placeholder='0'
        value={currShare}
        onChange={(e) => { setCurrShare(onlyPercent(e.target.value)) }}
        className="text-sm rounded-md outline-none p-2 -mt-10 h-10 ml-80 bg-gray-50 absolute border w-16 text-center rounded-l-none" />
    </div >
  )
}


export function NumberInput({ placeHolder, setValue, value, isDisabled, isDecimal = false }: {
  placeHolder: string,
  setValue: (value: number) => void,
  value?: string,
  isDisabled?: boolean,
  isDecimal?: boolean
}) {

  const [currValue, setCurrValue] = useState(value || '0')
  useEffect(() => {
    setValue(isDecimal ? parseFloat(currValue || '0') : parseInt(currValue || '0'))
  }, [currValue, isDecimal, setValue])

  useEffect(() => {
    setCurrValue(value || '')
  }, [value, setCurrValue])

  return (
    <div>
      <input
        type="text"
        placeholder={placeHolder}
        value={currValue}
        disabled={isDisabled}
        onChange={(e) => { setCurrValue(onlyNumber(e.target.value, isDecimal)) }}
        className="block w-96 p-2 h-10 text-sm rounded-md outline-none bg-white border"
      />
    </div>
  )
}

export function TextArea({ placeholder, setValue, value, isDisabled }: {
  placeholder: string,
  setValue: (value: string) => void,
  value?: string
  isDisabled?: boolean
}) {

  const [currValue, setCurrValue] = useState(value || '')

  useEffect(() => {
    setValue(currValue)
  }, [currValue, setValue])

  return (
    <div>
      <textarea
        placeholder={placeholder}
        value={currValue}
        disabled={isDisabled}
        onChange={(e) => { setCurrValue(e.target.value) }}
        className="block w-96 p-2 text-sm rounded-md outline-none bg-white border h-48 resize-none"
      />
    </div>
  )
}

export function Toggle({ label, setValue, checked }: {
  label: string,
  checked: boolean,
  setValue: (checked: boolean) => void
}) {
  const [isChecked, setIsChecked] = useState(checked)
  useEffect(() => {
    setValue(isChecked)
  }, [isChecked, setValue])

  return (
    <div className="flex flex-row gap-4 items-center my-2 select-none cursor-pointer">
      <div className={`w-8 h-5 ${isChecked ? 'bg-purple-800' : 'bg-gray-300'} rounded-full p-0.5`} onClick={() => setIsChecked(!isChecked)}>
        <div className={`w-4 h-4 bg-white rounded-full ${isChecked ? 'float-right' : ''}`}></div>
      </div>
      <div className={`${isChecked ? 'text-gray-600' : 'text-gray-400'}`}>{label}</div>
    </div>
  )
}