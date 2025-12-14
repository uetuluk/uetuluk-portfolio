import { describe, it, expect } from 'vitest';
import {
  createMockAI,
  createSequentialMockAI,
  createAIResponse,
  createMockErrorAI,
  createMockInvalidJsonAI,
  createEnvWithMockAI,
} from './ai-gateway';

describe('AI Gateway Mocks', () => {
  describe('createMockAI', () => {
    it('returns response with text() method', async () => {
      const mockAI = createMockAI({
        ok: true,
        response: createAIResponse('test content'),
      });

      const gateway = mockAI.gateway('test-id');
      const response = await gateway.run({} as never);

      // This covers line 55 (and 246 in sequential): .text() method
      const text = await response.text();
      expect(text).toContain('test content');
    });

    it('returns responseText when provided', async () => {
      const mockAI = createMockAI({
        ok: true,
        responseText: 'custom text response',
      });

      const gateway = mockAI.gateway('test-id');
      const response = await gateway.run({} as never);
      const text = await response.text();

      expect(text).toBe('custom text response');
    });

    it('returns empty string when no response or responseText', async () => {
      const mockAI = createMockAI({
        ok: true,
      });

      const gateway = mockAI.gateway('test-id');
      const response = await gateway.run({} as never);
      const text = await response.text();

      expect(text).toBe('');
    });
  });

  describe('createSequentialMockAI', () => {
    it('returns different responses on sequential calls', async () => {
      const responses = [createAIResponse('first'), createAIResponse('second')];
      const mockAI = createSequentialMockAI(responses);
      const gateway = mockAI.gateway('test-id');

      const result1 = await gateway.run({} as never);
      expect(await result1.json()).toEqual(responses[0]);

      const result2 = await gateway.run({} as never);
      expect(await result2.json()).toEqual(responses[1]);
    });

    it('falls back to last response when index exceeds array length', async () => {
      const responses = [createAIResponse('first'), createAIResponse('last')];
      const mockAI = createSequentialMockAI(responses);
      const gateway = mockAI.gateway('test-id');

      await gateway.run({} as never); // First
      await gateway.run({} as never); // Second (last)
      const result3 = await gateway.run({} as never); // Beyond length - should return last

      expect(await result3.json()).toEqual(responses[1]);
    });

    it('provides text representation of sequential responses', async () => {
      const content = { data: 'test' };
      const responses = [createAIResponse(JSON.stringify(content))];
      const mockAI = createSequentialMockAI(responses);
      const gateway = mockAI.gateway('test-id');

      const result = await gateway.run({} as never);
      const textContent = await result.text(); // Covers line 246

      expect(textContent).toContain('test');
    });
  });

  describe('createMockErrorAI', () => {
    it('creates error responses with proper structure', async () => {
      const mockAI = createMockErrorAI(500, 'Server error');
      const gateway = mockAI.gateway('test-id');

      const result = await gateway.run({} as never);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(await result.text()).toBe('Server error');
    });

    it('includes error object in json response', async () => {
      const mockAI = createMockErrorAI(429, 'Rate limited');
      const gateway = mockAI.gateway('test-id');

      const result = await gateway.run({} as never);
      const json = await result.json();

      expect(json).toEqual({ error: { message: 'Rate limited' } });
    });
  });

  describe('createMockInvalidJsonAI', () => {
    it('returns invalid JSON that can be retrieved as text', async () => {
      const mockAI = createMockInvalidJsonAI();
      const gateway = mockAI.gateway('test-id');

      const result = await gateway.run({} as never);
      const textContent = await result.text();

      expect(textContent).toContain('invalid json');
    });
  });

  describe('createEnvWithMockAI', () => {
    it('merges mock AI into base env', () => {
      const baseEnv = { SOME_VAR: 'value' };
      const mockAI = createMockAI({});

      const result = createEnvWithMockAI(baseEnv, mockAI);

      expect(result.SOME_VAR).toBe('value');
      expect(result.AI).toBe(mockAI);
      expect(result.AI_GATEWAY_ID).toBe('test-gateway');
    });

    it('uses custom gateway ID when provided', () => {
      const baseEnv = {};
      const mockAI = createMockAI({});

      const result = createEnvWithMockAI(baseEnv, mockAI, 'custom-gateway');

      expect(result.AI_GATEWAY_ID).toBe('custom-gateway');
    });
  });
});
