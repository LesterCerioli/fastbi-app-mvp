import { NLPProcessor, QueryIntent } from "./vectorizer";

export class EnhancedTFIDFVectorizer {
  nlp: NLPProcessor;

  constructor() {
    this.nlp = new NLPProcessor();
  }

  preprocessText(text: string): string {
    return this.nlp.preprocessText(text);
  }

  extractIntent(text: string): QueryIntent {
    return this.nlp.extractIntent(text);
  }
}
