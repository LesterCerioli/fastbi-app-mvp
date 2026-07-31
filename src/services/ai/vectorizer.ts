export class NLPProcessor {
  private stopwordsPt: Set<string> = new Set();
  private stopwordsEn: Set<string> = new Set();
  private synonyms: Map<string, string> = new Map();
  private stemCache: Map<string, string> = new Map();

  constructor() {
    this.initStopwords();
    this.initSynonyms();
  }

  private initStopwords(): void {
    const ptStopwords = ["a", "o", "e", "de", "da", "do", "em", "um", "uma", "para", "com", "por", "mais", "menos", "como", "seu", "sua", "seus", "suas", "na", "no", "das", "dos", "as", "os", "ao", "aos", "pelo", "pela", "pelos", "pelas"];
    for (const w of ptStopwords) this.stopwordsPt.add(w);

    const enStopwords = ["the", "a", "an", "and", "or", "of", "to", "for", "in", "on", "at", "by", "with", "without", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing"];
    for (const w of enStopwords) this.stopwordsEn.add(w);
  }

  private initSynonyms(): void {
    const synonymsList: Record<string, string> = {
      "vendas": "venda", "vendeu": "venda", "venderam": "venda", "faturamento": "venda", "receita": "venda",
      "total": "sum", "soma": "sum", "somatoria": "sum", "quanto": "amount", "valor": "amount", "preco": "amount",
      "sales": "sale", "sold": "sale", "revenue": "sale", "total revenue": "sum", "amount": "amount", "price": "amount",
      "janeiro": "jan", "fevereiro": "feb", "marco": "mar", "abril": "apr", "maio": "may", "junho": "jun",
      "julho": "jul", "agosto": "aug", "setembro": "sep", "outubro": "oct", "novembro": "nov", "dezembro": "dec",
      "january": "jan", "february": "feb", "march": "mar", "april": "apr", "june": "jun", "july": "jul",
      "august": "aug", "september": "sep", "october": "oct", "november": "nov", "december": "dec",
    };
    for (const [k, v] of Object.entries(synonymsList)) {
      this.synonyms.set(k.toLowerCase(), v);
    }
  }

  preprocessText(text: string): string {
    text = text.toLowerCase();

    const punctuation = [".", ",", "?", "!", ":", ";", "\"", "'", "(", ")", "[", "]", "{", "}"];
    for (const p of punctuation) {
      text = text.replaceAll(p, " ");
    }

    const words = text.split(/\s+/).filter(Boolean);

    const processed: string[] = [];
    for (let word of words) {
      if (this.isStopword(word)) continue;
      if (this.synonyms.has(word)) word = this.synonyms.get(word)!;
      word = this.stem(word);
      processed.push(word);
    }

    return processed.join(" ");
  }

  private isStopword(word: string): boolean {
    if (/[áãâéêíóôúç]/.test(word)) {
      return this.stopwordsPt.has(word);
    }
    return this.stopwordsEn.has(word);
  }

  private stem(word: string): string {
    if (this.stemCache.has(word)) return this.stemCache.get(word)!;
    const stemmed = this.porterStemmer(word);
    this.stemCache.set(word, stemmed);
    return stemmed;
  }

  private porterStemmer(word: string): string {
    const suffixes = ["s", "es", "ies", "ed", "ing", "ly", "ment", "tion", "sion", "able", "ible", "al", "ial", "ic", "ive", "ous", "ful", "less", "ness", "mente", "ado", "ido", "ando", "indo"];

    let stemmed = word;
    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix)) {
        stemmed = stemmed.slice(0, -suffix.length);
        break;
      }
    }

    if (stemmed === "vend") return "venda";
    if (stemmed === "sal") return "sale";
    if (stemmed.length < 2) return word;

    return stemmed;
  }

  extractIntent(question: string): QueryIntent {
    const preprocessed = this.preprocessText(question);
    const words = preprocessed.split(/\s+/).filter(Boolean);

    const intent: QueryIntent = {
      aggregation: "sum",
      metric: "amount",
      confidence: 0,
    };

    for (const word of words) {
      switch (word) {
        case "sum": case "total": case "soma": case "somatoria":
          intent.aggregation = "sum";
          intent.confidence += 0.3;
          break;
        case "count": case "quantos": case "numero": case "quantidade":
          intent.aggregation = "count";
          intent.metric = "transactions";
          intent.confidence += 0.3;
          break;
        case "average": case "media": case "avg": case "medio":
          intent.aggregation = "avg";
          intent.confidence += 0.3;
          break;
        case "min": case "menor": case "minimo":
          intent.aggregation = "min";
          intent.confidence += 0.3;
          break;
        case "max": case "maior": case "maximo":
          intent.aggregation = "max";
          intent.confidence += 0.3;
          break;
      }
    }

    for (const word of words) {
      switch (word) {
        case "amount": case "valor": case "preco": case "faturamento":
          intent.metric = "amount";
          intent.confidence += 0.2;
          break;
        case "quantity": case "quantidade":
          intent.metric = "quantity";
          intent.confidence += 0.2;
          break;
      }
    }

    const entityKeywords: Record<string, string> = {
      "produto": "product", "product": "product",
      "categoria": "category", "category": "category",
      "regiao": "region", "region": "region",
      "canal": "channel", "channel": "channel",
      "cliente": "customer", "customer": "customer",
    };

    for (const word of words) {
      if (entityKeywords[word]) {
        intent.entity = entityKeywords[word];
        intent.confidence += 0.2;
      }
    }

    for (let i = 0; i < words.length; i++) {
      if (intent.entity && entityKeywords[words[i]] && i + 1 < words.length) {
        intent.entityName = words[i + 1];
        intent.confidence += 0.3;
      }
    }

    if (intent.confidence > 1.0) intent.confidence = 1.0;

    return intent;
  }
}

export interface QueryIntent {
  aggregation: string;
  metric: string;
  entity?: string;
  entityName?: string;
  periodStart?: string;
  periodEnd?: string;
  confidence: number;
}

export class EnhancedTFIDFVectorizer {
  nlp: NLPProcessor;

  constructor() {
    this.nlp = new NLPProcessor();
  }

  textToVector(text: string): number[] {
    const processedText = this.nlp.preprocessText(text);
    const words = processedText.split(/\s+/).filter(Boolean);

    const tf = new Map<string, number>();
    const wordWeights: Record<string, number> = {
      "venda": 1.5, "sum": 1.3, "total": 1.3, "amount": 1.2,
      "produto": 1.2, "categoria": 1.1, "region": 1.1,
    };

    for (const word of words) {
      const weight = wordWeights[word] ?? 1.0;
      tf.set(word, (tf.get(word) ?? 0) + weight);
    }

    const vectorSize = 200;
    const vector = new Array(vectorSize).fill(0);

    for (let i = 0; i < words.length && i < vectorSize; i++) {
      const pos = this.hash(words[i]) % vectorSize;
      vector[pos] = tf.get(words[i]) ?? 0;
    }

    let norm = 0;
    for (const val of vector) norm += val * val;
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  answerQuestion(question: string, context: string[]): string {
    const intent = this.nlp.extractIntent(question);
    const questionVector = this.textToVector(question);

    let bestContext = "";
    let bestSimilarity = -1;

    for (const ctx of context) {
      const ctxVector = this.textToVector(ctx);
      const similarity = this.cosineSimilarity(questionVector, ctxVector);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestContext = ctx;
      }
    }

    if (intent.confidence > 0.5) {
      return this.generateResponse(intent, bestContext, bestSimilarity);
    }

    return "Desculpe, não entendi completamente sua pergunta. Poderia reformular?";
  }

  private generateResponse(intent: QueryIntent, _context: string, _similarity: number): string {
    switch (intent.aggregation) {
      case "sum":
        return "Com base na sua pergunta sobre vendas, estou processando o total solicitado...";
      case "count":
        return "Identificamos uma consulta de contagem. Processando quantidade de transações...";
      case "avg":
        return "Calculando a média dos valores conforme sua solicitação...";
      default:
        return "Analisando informações sobre vendas para responder sua pergunta...";
    }
  }

  private hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) + h + s.charCodeAt(i);
    }
    return h < 0 ? -h : h;
  }
}
