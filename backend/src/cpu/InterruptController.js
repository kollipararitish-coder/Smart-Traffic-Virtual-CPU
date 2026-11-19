/**
 * InterruptController.js
 * Hardware Interrupt Management for Educational Virtual CPU
 * Handles Interrupt Requests (IRQ), Vector Resolution, and ISR Transitions.
 */

export class InterruptController {
  constructor(memory) {
    this.memory = memory;
    this.reset();
  }

  reset() {
    this.pendingQueue = [];
    this.inService = false;
    this.currentInterrupt = null;
    this.stats = {
      totalInterruptsHandled: 0,
      emergencyInterrupts: 0
    };
  }

  /**
   * Request an interrupt
   * @param {number} vector - Memory address in Interrupt Vector Table (e.g., 0x0004 for Emergency)
   * @param {object} payload - Additional event details (e.g., emergency direction)
   */
  requestInterrupt(vector, payload = {}) {
    // Avoid duplicate queueing of same pending interrupt
    const exists = this.pendingQueue.some(item => item.vector === vector);
    if (!exists) {
      this.pendingQueue.push({
        vector,
        payload,
        timestamp: Date.now()
      });
      // Sort by priority (lower vector = higher priority)
      this.pendingQueue.sort((a, b) => a.vector - b.vector);
    }
  }

  hasPending() {
    return this.pendingQueue.length > 0 && !this.inService;
  }

  /**
   * Called by CPU to acknowledge and take the next interrupt
   */
  acknowledge() {
    if (this.pendingQueue.length === 0) return null;

    const intr = this.pendingQueue.shift();
    this.inService = true;
    this.currentInterrupt = intr;
    this.stats.totalInterruptsHandled++;
    if (intr.vector === 0x0004) {
      this.stats.emergencyInterrupts++;
    }

    // Read target ISR address from IVT in memory
    const isrAddress = this.memory.read(intr.vector);

    return {
      vector: intr.vector,
      isrAddress: isrAddress || 0x0200,
      payload: intr.payload
    };
  }

  /**
   * Called on IRET instruction execution
   */
  returnFromInterrupt() {
    this.inService = false;
    const finished = this.currentInterrupt;
    this.currentInterrupt = null;
    return finished;
  }

  getState() {
    return {
      hasPending: this.pendingQueue.length > 0,
      pendingCount: this.pendingQueue.length,
      inService: this.inService,
      currentInterrupt: this.currentInterrupt,
      stats: { ...this.stats }
    };
  }
}
