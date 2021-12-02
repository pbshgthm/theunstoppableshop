import type { NextApiRequest, NextApiResponse } from 'next'
import { decryptStr, encryptConst } from '../../lib/encDec'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  try {

    const sourceEncryptedText = req.body.sourceEncryptedText

    const apiPrivateKey = process.env.API_PRIVATE_KEY as string
    const plainText = decryptStr(sourceEncryptedText, apiPrivateKey)

    const targetPublicKey = req.body.targetPublicKey
    const targetCipherText = encryptConst(plainText, targetPublicKey)
    res.status(200).json({ targetCipherText })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }
}


/*
SELLER
{
    "privateKey": "2ae98e27fa568bcb1d0655eb19b75fa1088b293c40b22aade2b8433607d527d9",
    "publicKey": "62Y/Ty+Q/z9hJdu+c0gKVuGtxW4zv/0sqInaBmOiE0M="
}
BUYER
{
    "privateKey": "7f014c2e95b9f8ee80be4713b941c043928e2e85c2be2fba78036d88e184d73e",
    "publicKey": "uwLcYohjgmy7lzeyQfW8rVSTRB6dr9Wp755zlT2Lnzg="
}
API
{
  "publicKey" : "N8Dux/ah3ee2dLjKUAHDQOJE5cXAC/WflFUF0UfUmGQ="
}

"{\"version\":\"x25519-xsalsa20-poly1305\",\"nonce\":\"2f+FQPeKzNJrWEehvJKAQ5uY+hpMBaYQ4\",\"ephemPublicKey\":\"KfmQWzhihX0xHvJvhd5wGFClqypNX6VTvCaHcvEYshXA=\",\"ciphertext\":\"---\"}"

{\"version\":\"x25519-xsalsa20-poly1305\",\"nonce\":\"2+utoN/XpaL4AI8i//8OUmmc2iWb0R71\",\"ephemPublicKey\":\"KpfQweAqu266Ddzgz4ISJo4Bcg1ezeHwm8gnOHMdXwg=\",\"ciphertext\":\"4M20T4yvHVJGfgHz5Fm+MZAFl594\"}

"{\"version\": \"x25519-xsalsa20-poly1305\",\"nonce\":\"f+FQPeKzNJrWEehvJKAQ5uY+hpMBaYQ4\",\"ephemPublicKey\":\"fmQWzhihX0xHvJvhd5wGFClqypNX6VTvCaHcvEYshXA=\",\"ciphertext\":\"-----\"}"
*/
