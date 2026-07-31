import { EnhancedTFIDFVectorizer } from "../src/services/ai/enhanced_tfidf_vectorizer";

describe("EnhancedTFIDFVectorizer", () => {
  let vectorizer: EnhancedTFIDFVectorizer;

  beforeEach(() => {
    vectorizer = new EnhancedTFIDFVectorizer();
  });

  describe("preprocessText", () => {
    it("preprocesses text by lowercasing and removing stopwords", () => {
      const result = vectorizer.preprocessText("The sales revenue was 100 dollars");
      expect(result).not.toContain("the");
      expect(result).toContain("sale");
    });

    it("handles empty string", () => {
      expect(vectorizer.preprocessText("")).toBe("");
    });

    it("handles text with only stopwords", () => {
      const result = vectorizer.preprocessText("the and or of");
      expect(result.trim()).toBe("");
    });

    it("handles text with punctuation", () => {
      const result = vectorizer.preprocessText("Hello, world! Revenue?");
      expect(result).not.toContain(",");
      expect(result).not.toContain("!");
    });
  });

  describe("extractIntent", () => {
    it("extracts sum intent from query", () => {
      const intent = vectorizer.extractIntent("total sales revenue");
      expect(intent.aggregation).toBe("sum");
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it("extracts count intent from query", () => {
      const intent = vectorizer.extractIntent("count number of transactions");
      expect(intent.aggregation).toBe("count");
      expect(intent.metric).toBe("transactions");
    });

    it("extracts avg intent from query", () => {
      const intent = vectorizer.extractIntent("average amount per sale");
      expect(intent.aggregation).toBe("avg");
    });

    it("returns default intent for gibberish", () => {
      const intent = vectorizer.extractIntent("xyzzy flurbo garble");
      expect(intent.confidence).toBe(0);
      expect(intent.aggregation).toBe("sum");
    });
  });
});
