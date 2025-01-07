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