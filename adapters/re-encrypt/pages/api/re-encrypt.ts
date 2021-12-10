import type { NextApiRequest, NextApiResponse } from 'next'
import { decryptStr, encryptConst } from '../../lib/encDec'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  try {

    console.log(req.url)
    const encryptedTextRaw = req.query.encryptedText as string
    const publicKeyRaw = req.query.publicKey as string

    const encryptedText = Buffer.from(encryptedTextRaw.replace(/ /g, '+'), 'base64').toString()
    const publicKey = Buffer.from(publicKeyRaw.replace(/ /g, '+'), 'base64').toString()
    const apiPrivateKey = process.env.API_PRIVATE_KEY as string
    const plainText = decryptStr(encryptedText, apiPrivateKey)

    console.log({ publicKey, encryptedText, plainText }, 'AAA')

    const targetCipherText = encryptConst(plainText, publicKey)
    const result = {
      reEncryptedText: targetCipherText,
      reEncrypted_0: targetCipherText.substr(0, 32),
      reEncrypted_1: targetCipherText.substr(32),
    }
    console.log(result, 'AAA')
    res.status(200).json(result)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }
}