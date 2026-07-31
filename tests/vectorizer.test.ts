import { NLPProcessor, EnhancedTFIDFVectorizer } from "../src/services/ai/vectorizer";

describe("NLPProcessor", () => {
  let nlp: NLPProcessor;

  beforeEach(() => {
    nlp = new NLPProcessor();
  });

  describe("preprocessText", () => {
    it("lowercases and removes punctuation", () => {
      const result = nlp.preprocessText("Hello, World! How are you?");
      expect(result).not.toContain(",");
      expect(result).not.toContain("!");
      expect(result).not.toContain("?");
    });

    it("removes stopwords", () => {
      const result = nlp.preprocessText("the quick brown fox");
      expect(result).not.toContain("the");
    });

    it("applies synonyms", () => {
      const result = nlp.preprocessText("revenue");
      expect(result).toContain("sale");
    });

    it("applies stemming", () => {
      const result = nlp.preprocessText("running");
      expect(result).not.toContain("running");
    });

    it("handles empty text", () => {
      const result = nlp.preprocessText("");
      expect(result).toBe("");
    });

    it("handles text with only stopwords", () => {
      const result = nlp.preprocessText("the and of to");
      expect(result).toBe("");
    });

    it("handles Portuguese stopwords via English set for unaccented words", () => {
      const result = nlp.preprocessText("o valor total de vendas");
      expect(result).toContain("amount");
      expect(result).toContain("venda");
    });

    it("returns stemmed joined words", () => {
      const result = nlp.preprocessText("sales amount quantity");
      expect(result.split(/\s+/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("extractIntent", () => {
    it("extracts sum aggregation", () => {
      const result = nlp.extractIntent("total sales amount");
      expect(result.aggregation).toBe("sum");
    });

    it("extracts count aggregation", () => {
      const result = nlp.extractIntent("count transactions");
      expect(result.aggregation).toBe("count");
    });

    it("extracts avg aggregation", () => {
      const result = nlp.extractIntent("average price");
      expect(result.aggregation).toBe("avg");
    });

    it("extracts min aggregation", () => {
      const result = nlp.extractIntent("min amount");
      expect(result.aggregation).toBe("min");
    });

    it("extracts max aggregation", () => {
      const result = nlp.extractIntent("total max");
      expect(result.aggregation).toBe("max");
    });

    it("defaults to sum aggregation when no keywords", () => {
      const result = nlp.extractIntent("what is happening");
      expect(result.aggregation).toBe("sum");
    });

    it("extracts entity from keywords", () => {
      const result = nlp.extractIntent("sales by product");
      expect(result.entity).toBe("product");
    });

    it("confidence is between 0 and 1", () => {
      const result = nlp.extractIntent("total sales revenue by product in region");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("caps confidence at 1.0", () => {
      const result = nlp.extractIntent("total sum average count min max amount quantity product category region channel customer");
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe("EnhancedTFIDFVectorizer", () => {
  let vectorizer: EnhancedTFIDFVectorizer;

  beforeEach(() => {
    vectorizer = new EnhancedTFIDFVectorizer();
  });

  describe("textToVector", () => {
    it("returns vector of size 200", () => {
      const vec = vectorizer.textToVector("test text");
      expect(vec).toHaveLength(200);
    });

    it("returns normalized vector", () => {
      const vec = vectorizer.textToVector("hello world");
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      expect(norm).toBeCloseTo(1, 1);
    });

    it("returns zero vector for empty input", () => {
      const vec = vectorizer.textToVector("");
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      expect(norm).toBe(0);
    });

    it("returns consistent vectors for same input", () => {
      const a = vectorizer.textToVector("sales revenue");
      const b = vectorizer.textToVector("sales revenue");
      expect(a).toEqual(b);
    });

    it("returns different vectors for different inputs", () => {
      const a = vectorizer.textToVector("sales revenue");
      const b = vectorizer.textToVector("cost expenses");
      expect(a).not.toEqual(b);
    });

    it("applies word weights for known terms", () => {
      const vec = vectorizer.textToVector("venda");
      const hasNonZero = vec.some(v => v > 0);
      expect(hasNonZero).toBe(true);
    });

    it("handles text with only stopwords", () => {
      const vec = vectorizer.textToVector("the and of");
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      expect(norm).toBe(0);
    });

    it("vector elements are non-negative", () => {
      const vec = vectorizer.textToVector("test data here");
      for (const v of vec) {
        expect(v).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      const vec = vectorizer.textToVector("test");
      const sim = vectorizer.cosineSimilarity(vec, vec);
      expect(sim).toBeCloseTo(1, 5);
    });

    it("returns 0 for orthogonal vectors", () => {
      const sim = vectorizer.cosineSimilarity([1, 0], [0, 1]);
      expect(sim).toBe(0);
    });

    it("returns 0 for zero vectors", () => {
      const sim = vectorizer.cosineSimilarity([0, 0], [0, 0]);
      expect(sim).toBe(0);
    });

    it("returns value between -1 and 1 for non-zero vectors", () => {
      const a = vectorizer.textToVector("sales revenue");
      const b = vectorizer.textToVector("cost analysis");
      const sim = vectorizer.cosineSimilarity(a, b);
      expect(sim).toBeGreaterThanOrEqual(-1);
      expect(sim).toBeLessThanOrEqual(1);
    });

    it("returns 0 for mismatched lengths", () => {
      const sim = vectorizer.cosineSimilarity([1, 2, 3], [1, 2]);
      expect(sim).toBe(0);
    });

    it("returns higher similarity for similar text", () => {
      const a = vectorizer.textToVector("sales revenue amount");
      const b = vectorizer.textToVector("revenue sales total");
      const c = vectorizer.textToVector("inventory cost expense");
      const simSimilar = vectorizer.cosineSimilarity(a, b);
      const simDiff = vectorizer.cosineSimilarity(a, c);
      expect(simSimilar).toBeGreaterThan(simDiff);
    });

    it("handles single element vectors", () => {
      const sim = vectorizer.cosineSimilarity([5], [10]);
      expect(sim).toBe(1);
    });

    it("is symmetric", () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      expect(vectorizer.cosineSimilarity(a, b)).toBeCloseTo(
        vectorizer.cosineSimilarity(b, a), 10
      );
    });
  });

  describe("answerQuestion", () => {
    it("returns response when confidence is high", () => {
      const result = vectorizer.answerQuestion("total sales revenue", [
        "sales data shows growth",
        "revenue increased in Q1",
      ]);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns fallback when confidence is low", () => {
      const result = vectorizer.answerQuestion("xyzzy", [
        "some unrelated context",
      ]);
      expect(result).toBe("Desculpe, não entendi completamente sua pergunta. Poderia reformular?");
    });

    it("returns sum response for total queries", () => {
      const result = vectorizer.answerQuestion("sum total amount", [
        "revenue was high",
      ]);
      expect(result).toContain("total");
    });

    it("returns count response for count queries", () => {
      const result = vectorizer.answerQuestion("total amount count", [
        "many customers",
      ]);
      expect(result).toContain("contagem");
    });

    it("handles empty context list", () => {
      const result = vectorizer.answerQuestion("total sales", []);
      expect(result).toBeTruthy();
    });

    it("returns avg response for average queries", () => {
      const result = vectorizer.answerQuestion("total average amount", [
        "price data",
      ]);
      expect(result).toContain("média");
    });

    it("handles Portuguese questions", () => {
      const result = vectorizer.answerQuestion("total de vendas por produto", [
        "vendas por produto",
      ]);
      expect(result).toBeTruthy();
    });

    it("selects best context by similarity", () => {
      const result = vectorizer.answerQuestion("total revenue", [
        "unrelated text about weather",
        "revenue and sales figures for the quarter",
      ]);
      expect(result).toBeTruthy();
    });
  });
});
