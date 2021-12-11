import useSWR from 'swr'
import config from '../config.json'
import { unzipFiles } from './utils'


async function ipfsFetcher(fn: string, cid: string) {
  return fetch(config.ipfsGateway + cid).then(res => res.blob())
}

export function useIPFS(cid: string | undefined) {
  const { data, error } = useSWR(['useIPFS', cid], ipfsFetcher)
  return { data, error }
}