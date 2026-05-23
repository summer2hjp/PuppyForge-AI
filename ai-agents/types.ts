export interface PuppySwarmAgent {
  run(input: any): Promise<any>;
}

export interface SwarmResult {
  diagnosis: any;
  prediction: any;
  growthPlan: any;
  message: string;
}