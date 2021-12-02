import { randomBytes } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { encryptStr } from '../../lib/encDec'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {

  try {
    const plainText = req.body.plainText
    const publicKey = req.body.publicKey
    const encryptedText = encryptStr(plainText, publicKey)
    const len = JSON.parse(encryptedText).ciphertext.length
    res.status(200).json({ encryptedText })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error })
  }
}
