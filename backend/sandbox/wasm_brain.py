import wasmtime
from wasmtime import Store, Module, Engine, Linker, Trap
import json

class PuppyBrainSandbox:
    def __init__(self, wasm_bytes: bytes, puppy_state: dict):
        self.engine = Engine()
        self.store = Store(self.engine)
        # 激进安全：开启燃料限制，防止恶意死循环 (10000 条指令/帧)
        self.store.set_fuel(10000) 
        self.state = puppy_state
        self.action_queue = []

        self.module = Module(self.engine, wasm_bytes)
        self.linker = Linker(self.engine)
        
        # 1. 注入 Host API：让 WASM 能够感知世界和做出动作
        self.linker.define_func("env", "get_state_json", self._host_get_state)
        self.linker.define_func("env", "emit_action", self._host_emit_action)
        
        self.instance = self.linker.instantiate(self.store, self.module)
        self.memory = self.instance.exports(self.store)["memory"]
        self.alloc = self.instance.exports(self.store)["alloc"]

    def _host_get_state(self, ptr: int, len: int):
        # 将后端状态序列化并写入 WASM 内存
        state_bytes = json.dumps(self.state).encode('utf-8')
        self.memory.data_ptr(self.store)[ptr:ptr+len] = state_bytes

    def _host_emit_action(self, ptr: int, len: int):
        # 读取 WASM 传回的动作指令
        action_bytes = bytes(self.memory.data_ptr(self.store)[ptr:ptr+len])
        self.action_queue.append(json.loads(action_bytes.decode('utf-8')))

    def tick(self, environment_events: list):
        """每帧驱动宠物思考"""
        self.store.set_fuel(10000) # 重置燃料
        self.action_queue.clear()
        
        try:
            on_tick = self.instance.exports(self.store)["on_tick"]
            # 将环境事件传入 WASM
            on_tick(self.store, len(environment_events))
        except Trap as e:
            # 捕获越界、除零或燃料耗尽，直接熔断，宠物进入“发呆”保护模式
            print(f"⚠️ Brain Meltdown (Sandbox Trapped): {e}")
            return []
            
        return self.action_queue

    def hot_swap(self, new_wasm_bytes: bytes):
        """无缝替换灵魂"""
        self.__init__(new_wasm_bytes, self.state)
