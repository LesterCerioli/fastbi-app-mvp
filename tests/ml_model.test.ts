import { LinearRegressionModel } from "../src/services/ai/ml_model";

describe("LinearRegressionModel", () => {
  let model: LinearRegressionModel;

  beforeEach(() => {
    model = new LinearRegressionModel();
  });

  describe("train", () => {
    it("trains with valid features and labels", async () => {
      const features = [[1], [2], [3], [4]];
      const labels = [2, 4, 6, 8];

      await model.train(features, labels);

      const weights = model.getWeights();
      const bias = model.getBias();
      expect(Math.abs(weights[0] - 2)).toBeLessThan(1);
    });

    it("updates weights after training", async () => {
      const initialWeights = model.getWeights();
      const features = [[1, 2], [2, 3], [3, 4]];
      const labels = [5, 7, 9];

      await model.train(features, labels);

      const trainedWeights = model.getWeights();
      expect(trainedWeights).not.toEqual(initialWeights);
    });

    it("handles single training example", async () => {
      const features = [[5]];
      const labels = [25];

      await expect(model.train(features, labels)).resolves.not.toThrow();

      const prediction = await model.predict([5]);
      expect(prediction).toBeGreaterThan(0);
    });

    it("handles multiple features per example", async () => {
      const features = [[1, 2], [2, 3], [3, 4], [4, 5]];
      const labels = [3, 5, 7, 9];

      await model.train(features, labels);

      expect(model.getWeights().length).toBe(2);
    });

    it("does not modify weights with empty features", async () => {
      const before = model.getWeights();

      await model.train([], []);

      expect(model.getWeights()).toEqual(before);
    });

    it("does not modify weights with empty labels", async () => {
      const before = model.getWeights();

      await model.train([[1], [2]], []);

      expect(model.getWeights()).toEqual(before);
    });

    it("handles features with fewer values than weights", async () => {
      model.setWeights([1, 2, 3]);
      const features = [[1]];

      await model.train(features, [5]);

      expect(model.getWeights()).toBeDefined();
    });

    it("converges with enough epochs", async () => {
      const features = [[1], [2], [3], [4], [5]];
      const labels = [10, 20, 30, 40, 50];

      await model.train(features, labels);

      const prediction = await model.predict([6]);
      expect(Math.abs(prediction - 60)).toBeLessThan(10);
    });
  });

  describe("predict", () => {
    it("returns bias when no training done", async () => {
      const prediction = await model.predict([1]);

      expect(prediction).toBe(0);
    });

    it("returns correct prediction after training", async () => {
      model.setWeights([3]);
      model.setBias(1);

      const prediction = await model.predict([2]);

      expect(prediction).toBe(7);
    });

    it("handles multi-feature predictions", async () => {
      model.setWeights([2, 3]);
      model.setBias(1);

      const prediction = await model.predict([4, 5]);

      expect(prediction).toBe(24);
    });

    it("handles fewer features than weights", async () => {
      model.setWeights([2, 3, 4]);
      model.setBias(1);

      const prediction = await model.predict([2]);

      expect(prediction).toBe(5);
    });

    it("returns 0 for empty feature array", async () => {
      const prediction = await model.predict([]);

      expect(prediction).toBe(model.getBias());
    });

    it("uses trained weights for prediction", async () => {
      const features = [[1], [2], [3]];
      const labels = [5, 10, 15];

      await model.train(features, labels);

      const prediction = await model.predict([4]);
      expect(prediction).toBeGreaterThan(0);
    });
  });

  describe("getWeights and setWeights", () => {
    it("returns zero-initialized weights", () => {
      expect(model.getWeights()).toEqual([0, 0]);
    });

    it("sets custom weights", () => {
      model.setWeights([1.5, 2.5]);

      expect(model.getWeights()).toEqual([1.5, 2.5]);
    });

    it("getWeights returns a copy not a reference", () => {
      const weights = model.getWeights();
      weights[0] = 999;

      expect(model.getWeights()[0]).toBe(0);
    });

    it("setWeights stores a copy", () => {
      const external = [1, 2];
      model.setWeights(external);
      external[0] = 999;

      expect(model.getWeights()[0]).toBe(1);
    });
  });

  describe("getBias and setBias", () => {
    it("returns zero-initialized bias", () => {
      expect(model.getBias()).toBe(0);
    });

    it("sets custom bias", () => {
      model.setBias(10);

      expect(model.getBias()).toBe(10);
    });

    it("bias affects predictions", async () => {
      model.setWeights([2]);
      model.setBias(5);

      const prediction = await model.predict([3]);

      expect(prediction).toBe(11);
    });
  });
});
