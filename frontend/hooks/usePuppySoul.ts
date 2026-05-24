// frontend/lib/petDB.ts
const DB_NAME = 'PuppyForgeSoulDB';
const DB_VERSION = 3; // 每次 schema 升级就 +1

export interface PetMemory {
  id: string;
  timestamp: number;
  type: 'interaction' | 'evolution' | 'trait_drift' | 'emotion';
  content: string;
  impact: number; // 对性格的影响值
  mood: number; // -100 ~ 100
}

export interface PetTraits {
  loyalty: number;
  chaos: number;
  curiosity: number;
  aggression: number;
  affection: number;
  [key: string]: number;
}

export interface PuppySoul {
  id: string;
  name: string;
  level: number;
  experience: number;
  traits: PetTraits;
  memories: PetMemory[];
  lastActive: number;
  totalInteractions: number;
  evolutionStage: 'puppy' | 'rebel' | 'legend';
}

// ==================== 狂暴 IndexedDB 引擎 ====================
class PuppySoulDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('🐕‍🦺 PuppyForge 本地灵魂数据库已觉醒');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('souls')) {
          const store = db.createObjectStore('souls', { keyPath: 'id' });
          store.createIndex('lastActive', 'lastActive', { unique: false });
        }

        if (!db.objectStoreNames.contains('memories')) {
          const memStore = db.createObjectStore('memories', { keyPath: 'id' });
          memStore.createIndex('soulId', 'soulId', { unique: false });
          memStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveSoul(soul: PuppySoul): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('souls', 'readwrite');
      const store = tx.objectStore('souls');
      store.put(soul);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async loadSoul(soulId: string): Promise<PuppySoul | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('souls', 'readonly');
      const store = tx.objectStore('souls');
      const request = store.get(soulId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async addMemory(soulId: string, memory: Omit<PetMemory, 'id'>): Promise<void> {
    if (!this.db) await this.init();
    const fullMemory: PetMemory = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`
    };

    const tx = this.db!.transaction(['memories', 'souls'], 'readwrite');
    tx.objectStore('memories').add(fullMemory);

    // 同步更新主灵魂（记忆漂移影响性格）
    const soul = await this.loadSoul(soulId);
    if (soul) {
      soul.memories.push(fullMemory);
      soul.lastActive = Date.now();
      soul.totalInteractions++;
      
      // 激进性格漂移
      if (memory.impact > 0) {
        Object.keys(soul.traits).forEach(key => {
          soul.traits[key] = Math.max(0, Math.min(100, 
            soul.traits[key] + (memory.impact * (Math.random() - 0.3))
          ));
        });
      }
      tx.objectStore('souls').put(soul);
    }
    tx.oncomplete = () => console.log('🧠 记忆已注入本地灵魂');
  }

  async getAllMemories(soulId: string): Promise<PetMemory[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx = this.db!.transaction('memories', 'readonly');
      const store = tx.objectStore('memories');
      const index = store.index('soulId');
      const request = index.getAll(soulId);
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
    });
  }
}

export const puppyDB = new PuppySoulDB();
