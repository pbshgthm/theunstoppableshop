import { ethers } from 'ethers'
import useSWR from 'swr'
import { chainLinkABI } from './link-abi'
import { payableABI } from './payable-abi'

const rpcApi = 'https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV'
const chainLinkAddress = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
const payableAddress = '0x5749c79b3Ec884234c8510c638F35B8524BbC2B8'
const provider = new ethers.providers.JsonRpcProvider(rpcApi)


export function useLinkBalance(account: string) {
  const ChainLink = new ethers.Contract(chainLinkAddress, chainLinkABI, provider)
  async function fetcher() {
    return await ChainLink.balanceOf(account).then((balance: ethers.BigNumberish) => {
      return ethers.utils.formatEther(balance)
    })
  }
  const { data, error } = useSWR(['balance', account], fetcher)
  return { data, error }
}

export function useEvents(account: string) {

  async function fetcher() {
    const response = provider.getLogs({
      address: chainLinkAddress,
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ethers.utils.hexZeroPad(account, 32)
      ],
      fromBlock: "0x0",
      toBlock: 'latest'
    })
    return response
  }
  const { data, error } = useSWR(['events', account], fetcher)
  return { data, error }
}

export function sendLink(
  ethereum: ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  const ChainLink = new ethers.Contract(chainLinkAddress, chainLinkABI, signer)
  const amount = ethers.utils.parseEther('0.1')
  const tx = ChainLink.transfer(
    '0xf9c03776f126Ed6E43fBD2714A4bD293ba5E3515', // to address
    amount
  )
  console.log('tx', tx)
}

//
export function sendEther(
  ethereum: ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  const Payable = new ethers.Contract(payableAddress, payableABI, signer)
  const tx = Payable.deposit(
    { value: ethers.utils.parseEther("0.000001") }
  )
  console.log('tx', tx)
}
