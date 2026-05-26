import { useSoulWebSocket } from '@/lib/soul-websocket';

describe('Soul WebSocket 实时交互系统测试', () => {
  let mockWebSocket: any;
  let originalWebSocket: any;

  beforeEach(() => {
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      onmessage: null,
      onopen: null,
      onerror: null,
      onclose: null,
    };

    originalWebSocket = global.WebSocket;
    global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  it('成功建立WebSocket连接并订阅宠物灵魂状态', () => {
    const { connect, sendTraitUpdate, disconnect } = useSoulWebSocket('puppy-123');

    connect();
    expect(global.WebSocket).toHaveBeenCalledWith(expect.stringContaining('soul'));
    expect(mockWebSocket.send).toHaveBeenCalled();
  });

  it('接收实时trait漂移事件并触发回调', () => {
    const onTraitUpdate = jest.fn();

    const { connect } = useSoulWebSocket('puppy-123', onTraitUpdate);
    connect();

    // 模拟服务器推送
    const event = {
      data: JSON.stringify({
        type: 'trait_drift',
        petId: 'puppy-123',
        traits: { energy: 0.95, mood: 'happy' },
      }),
    };

    mockWebSocket.onmessage(event);
    expect(onTraitUpdate).toHaveBeenCalledWith(expect.objectContaining({ energy: 0.95 }));
  });

  it('连接断开后自动重连', () => {
    const { connect } = useSoulWebSocket('puppy-123');
    connect();

    mockWebSocket.onclose({ code: 1006 });
    expect(global.WebSocket).toHaveBeenCalledTimes(2); // 自动重连
  });

  it('发送trait更新指令', () => {
    const { connect, sendTraitUpdate } = useSoulWebSocket('puppy-123');
    connect();

    sendTraitUpdate({ energy: 0.8 });
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('energy')
    );
  });
});
