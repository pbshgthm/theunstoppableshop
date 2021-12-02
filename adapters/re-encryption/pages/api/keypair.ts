const sigUtil = require('@metamask/eth-sig-util')
const CryptoJS = require('crypto-js')
import type { NextApiRequest, NextApiResponse } from 'next'


export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {

  try {
    const privateKeyBytes = CryptoJS.lib.WordArray.random(32)
    const privateKey = privateKeyBytes.toString()
    const publicKeyStr = sigUtil.getEncryptionPublicKey(privateKey)
    const publicKey = Buffer.from(publicKeyStr).toString()
    res.status(200).json({ privateKey, publicKey })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }
}
