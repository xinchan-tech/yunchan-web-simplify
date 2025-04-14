import { getAllStocks } from '@/api'
import { useStockList } from '@/store'
import { useQuery } from '@tanstack/react-query'
import pako from 'pako'
import { useEffect, useMemo } from 'react'

export const useStockSearch = (keyword: string) => {
  const stockList = useStockList(s => s.list)
  const stockMap = useStockList(s => s.listMap)
  const stockListKey = useStockList(s => s.key)
  const setStockList = useStockList(s => s.setList)
  const query = useQuery({
    queryKey: [getAllStocks.cacheKey],
    queryFn: () => getAllStocks(stockListKey)
  })
  // const  = useRef<Trie>(new Trie())

  const trie = useMemo(() => {
    const trie = new Trie()
    stockList.forEach(item => trie.insert(item[1]))
    return trie
  }, [stockList])

  const result = useMemo(() => {
    if (!keyword) {
      return [...stockList]
    }

    return trie.searchPrefix(keyword.toUpperCase()).map(item => stockMap[item])
  }, [stockMap, keyword, stockList, trie])

  useEffect(() => {
    if (query.data?.key === stockListKey) return

    if (query.data?.data) {
      const data = atob(query.data.data)

      const dataUint8 = new Uint8Array(data.length)

      for (let i = 0; i < data.length; i++) {
        dataUint8[i] = data.charCodeAt(i)
      }

      const res = JSON.parse(pako.inflate(dataUint8, { to: 'string' })) as [string, string, string, string][]
      res.sort((a, b) => a[1].localeCompare(b[1]))
      setStockList(res, query.data.key)
    }
  }, [query.data, setStockList, stockListKey])

  return [result]
}

class TrieNode {
  children: Map<string, TrieNode>
  isEndOfWord: boolean

  constructor() {
    this.children = new Map()
    this.isEndOfWord = false
  }
}

export class Trie {
  root: TrieNode

  constructor() {
    this.root = new TrieNode()
  }

  insert(word: string) {
    let node = this.root
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode())
      }
      node = node.children.get(char)!
    }
    node.isEndOfWord = true
  }

  searchPrefix(prefix: string): string[] {
    let node = this.root
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return []
      }
      node = node.children.get(char)!
    }
    return this._collectAllWords(node, prefix)
  }

  private _collectAllWords(node: TrieNode, prefix: string): string[] {
    const words: string[] = []
    if (node.isEndOfWord) {
      words.push(prefix)
    }
    for (const [char, childNode] of node.children) {
      words.push(...this._collectAllWords(childNode, prefix + char))
    }
    return words
  }

  clear() {
    this.root = new TrieNode()
  }
}
