export class LinearRegressionModel {
  private weights: number[] = [0, 0];
  private bias: number = 0;

  getWeights(): number[] {
    return [...this.weights];
  }

  getBias(): number {
    return this.bias;
  }

  setWeights(weights: number[]): void {
    this.weights = [...weights];
  }

  setBias(bias: number): void {
    this.bias = bias;
  }

  async train(features: number[][], labels: number[]): Promise<void> {
    if (features.length === 0 || labels.length === 0) return;

    const learningRate = 0.01;
    const epochs = 100;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = new Array(this.weights.length).fill(0);
      let gradB = 0;

      for (let i = 0; i < features.length; i++) {
        let prediction = this.bias;
        for (let j = 0; j < this.weights.length; j++) {
          if (j < features[i].length) {
            prediction += this.weights[j] * features[i][j];
          }
        }

        const error = prediction - labels[i];

        for (let j = 0; j < this.weights.length; j++) {
          if (j < features[i].length) {
            gradW[j] += error * features[i][j];
          }
        }
        gradB += error;
      }

      for (let j = 0; j < this.weights.length; j++) {
        this.weights[j] -= (learningRate * gradW[j]) / features.length;
      }
      this.bias -= (learningRate * gradB) / features.length;
    }
  }

  async predict(features: number[]): Promise<number> {
    let prediction = this.bias;
    for (let i = 0; i < this.weights.length && i < features.length; i++) {
      prediction += this.weights[i] * features[i];
    }
    return prediction;
  }
}
