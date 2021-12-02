import { ethers } from 'ethers'
import useSWR from 'swr'
import { chainLinkABI } from './link-abi'
import { payableABI } from './payable-abi'

const rpcApi = 'https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV'
const chainLinkAddress = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
const payableAddress = '0x32dac56F7bd946291b4f23852763d739e34923C6'
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
    return response.then((logs: ethers.providers.Log[]) => {
      return logs.map(log => ILink.parseLog(log))
    })
  }
  let ILink = new ethers.utils.Interface(chainLinkABI)
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

// This function is used to send ether to a contract
export async function sendEther(
  ethereum: ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc) {
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
  console.log('signer', signer)
  const Payable = new ethers.Contract(payableAddress, payableABI, signer)
  console.log(Payable, 'Payable')
  const tx = Payable.deposit(
    { value: ethers.utils.parseEther("0.000001") }
  )
  console.log('tx', tx)
}
