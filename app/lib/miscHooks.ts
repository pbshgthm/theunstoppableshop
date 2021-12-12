import { useState } from 'react'
import useSWR from 'swr'
import useAsyncEffect from 'use-async-effect/types'
import config from '../config.json'
import { IShopDesc } from './types'
import { unPackIPFS } from './utils'


async function ipfsFetcher(fn: string, cid: string) {
  return fetch(config.ipfsGateway + cid).then(res => res.blob())
}

export function useIPFS(cid: string | undefined) {
  const { data, error } = useSWR(cid ? ['useIPFS', cid] : null, ipfsFetcher)
  return { data, error }
}