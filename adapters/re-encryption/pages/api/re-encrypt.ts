import type { NextApiRequest, NextApiResponse } from 'next'
import { decryptStr, encryptConst } from '../../lib/encDec'
const bytes32 = require('bytes32')

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  try {

    console.log(req.url)
    const encryptedTextRaw = req.query.encryptedText as string
    const publicKeyRaw = req.query.publicKey as string

    const encryptedText = Buffer.from(encryptedTextRaw.replace(/ /g, '+'), 'base64').toString('utf8')
    const publicKey = Buffer.from(publicKeyRaw.replace(/ /g, '+'), 'base64').toString()


    const apiPrivateKey = process.env.API_PRIVATE_KEY as string
    const plainText = decryptStr(encryptedText, apiPrivateKey)


    const targetCipherText = encryptConst(plainText, publicKey)
    const result = {
      reEncryptedText: targetCipherText,
      reEncryptedBytes32_0: bytes32({ input: targetCipherText.substr(0, 32) }),
      reEncryptedBytes32_1: bytes32({ input: targetCipherText.substr(32) }),
      reEncrypted_0: targetCipherText.substr(0, 32),
      reEncrypted_1: targetCipherText.substr(32),
    }
    res.status(200).json(result)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }
}
