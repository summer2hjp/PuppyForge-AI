export class PuppyMemory {
  async getSummary(puppyId: string) { return "summary"; }
  async update(puppyId: string, data: any) { console.log("updated"); }
}