declare let window: any
import { encryptStr } from '../lib/encDec'
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'


function handleAccountsChanged(e: string) {
  console.log('accounts changed', e)
}

const Home: NextPage = () => {

  const apiCred = {
    "version": "x25519-xsalsa20-poly1305",
    "nonce": "f+FQPeKzNJrWEehvJKAQ5uY+hpMBaYQ4",
    "ephemPublicKey": "fmQWzhihX0xHvJvhd5wGFClqypNX6VTvCaHcvEYshXA=",
  }
  const apiEncryptionKey = "N8Dux/ah3ee2dLjKUAHDQOJE5cXAC/WflFUF0UfUmGQ="
  const [license, setLicense] = useState('')
  const [buyerAccount, setBuyerAccount] = useState('')
  const [sellerLockedLicense, setSellerLockedLicense] = useState('-')
  const [contractLockedLicense, setContractLockedLicense] = useState('')
  const [contractBuyerKey, setContractBuyerKey] = useState('')
  const [buyerEncryptionKey, setBuyerEncryptionKey] = useState('-')
  const [approvedLicense, setApprovedLicense] = useState('-')
  const [buyerApprovedLicense, setBuyerApprovedLicense] = useState('')
  const [buyerLicense, setBuyerLicense] = useState('-')

  function getEncryptionKey() {
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((account: any) => {
        setBuyerAccount(account[0])
        window.ethereum
          .request({
            method: 'eth_getEncryptionPublicKey',
            params: [account[0]], // you must have access to the specified account
          })
          .then((result: string) => {
            setBuyerEncryptionKey(result)
          })
      })
  }

  function lockLicense() {
    setSellerLockedLicense(encryptStr(license, apiEncryptionKey))
  }

  function getLicense() {
    const data = JSON.parse(buyerApprovedLicense)
    window.ethereum
      .request({
        method: 'eth_decrypt',
        params: [buyerApprovedLicense, buyerAccount],
      })
      .then((decryptedMessage: string) =>
        setBuyerLicense(decryptedMessage)
      )
  }
  function approveLicense() {
    fetch('/api/byte32', {
      method: 'POST',
      body: JSON.stringify({
        sourceEncryptedText: contractLockedLicense,
        targetPublicKey: contractBuyerKey,
      }),
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    }).then(res => res.json()).then(res => {
      console.log(res)
      setApprovedLicense(res.targetCipherText)
    })
  }

  return (
    <div className="p-10">
      <div className="flex flex-row gap-8">
        <div className="w-1/2 bg-purple-100 p-8">
          <div className="text-xl text-gray-600">Seller</div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Api Encryption Key</div>
            <div className="text-gray-500 w-96 break-words">{apiEncryptionKey}</div>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">License</div>
            <input type="text" placeholder="License" className="p-2 rounded flex-grow" onChange={(e) => { setLicense(e.target.value) }} />
          </div>
          <div className="flex flex-row gap-2 my-8">
            <button className="bg-gray-700 p-2 rounded text-gray-200" onClick={lockLicense}>Lock License</button>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Locked License</div>
            <div className="text-gray-500 w-96 break-words">{sellerLockedLicense}</div>
          </div>
          <div className="h-1 bg-purple-200 my-12"></div>
          <div className="text-xl text-gray-600">Contract</div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Locked License</div>
            <input type="text" placeholder="Locked License" className="p-2 rounded flex-grow" onChange={(e) => { setContractLockedLicense(e.target.value) }} />
          </div>setContractBuyerKey
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Buyer Encryption Key</div>
            <input type="text" placeholder="Buyer Encryption Key" className="p-2 rounded flex-grow" onChange={(e) => { setContractBuyerKey(e.target.value) }} />
          </div>
          <div className="flex flex-row gap-2 my-8">
            <button className="bg-gray-700 p-2 rounded text-gray-200" onClick={approveLicense}>Approve License</button>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Approved License</div>
            <div className="text-gray-500 w-96 break-words">{approvedLicense}</div>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Full License</div>
            <div className="text-gray-500 w-96 break-words">{
              JSON.stringify({
                ...apiCred,
                ciphertext: approvedLicense,
              })
            }</div>
          </div>
        </div>
        <div className="w-1/2 bg-yellow-100 p-8">
          <div className="text-xl text-gray-600">Buyer</div>
          <div className="flex flex-row gap-2 my-8">
            <button className="bg-gray-700 p-2 rounded text-gray-200" onClick={getEncryptionKey}>Get Encryption Key</button>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Buyer Encryption Key</div>
            <div className="text-gray-500 flex-grow">{buyerEncryptionKey}</div>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">Approved License</div>
            <input type="text" placeholder="Approved License" className="p-2 rounded flex-grow" onChange={(e) => { setBuyerApprovedLicense(e.target.value) }} />
          </div>
          <div className="flex flex-row gap-2 my-8">
            <button className="bg-gray-700 p-2 rounded text-gray-200" onClick={getLicense}>Get License</button>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <div className="text-gray-600 w-44">License</div>
            <div className="text-gray-500 flex-grow">{buyerLicense}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
