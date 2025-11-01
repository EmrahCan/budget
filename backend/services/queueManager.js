const EventEmitter = require('events');
const logger = require('../utils/logger');

class QueueManager extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.workers = new Map();
    this.isProcessing = false;
    this.maxConcurrentJobs = 5;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.initialized = false;
  }

  /**
   * Initialize the queue manager
   */
  async initialize() {
    try {
      // Create default queues
      this.createQueue('reports', { concurrency: 3 });
      this.createQueue('cache', { concurrency: 2 });
      this.createQueue('aggregation', { concurrency: 1 });
      
      this.initialized = true;
      logger.info('Queue Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Queue Manager:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: this.initialized ? 'healthy' : 'unhealthy',
      queues: this.queues.size,
      processing: this.isProcessing
    };
  }

  /**
   * Get statistics
   */
  async getStats() {
    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = { ...queue.stats };
    }
    return stats;
  }

  /**
   * Shutdown
   */
  async shutdown() {
    this.isProcessing = false;
    this.queues.clear();
    this.workers.clear();
    this.initialized = false;
    logger.info('Queue Manager shutdown completed');
  }

  /**
   * Create a new queue
   */
  createQueue(name, options = {}) {
    const queue = {
      name,
      jobs: [],
      processing: false,
      options: {
        concurrency: options.concurrency || 1,
        retryAttempts: options.retryAttempts || this.retryAttempts,
        retryDelay: options.retryDelay || this.retryDelay,
        priority: options.priority || 0
      },
      stats: {
        completed: 0,
        failed: 0,
        active: 0,
        waiting: 0
      }
    };

    this.queues.set(name, queue);
    logger.info(`Queue created: ${name}`);
    return queue;
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName, jobData, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }

    const job = {
      id: this.generateJobId(),
      data: jobData,
      options: {
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: 0,
        maxAttempts: options.maxAttempts || queue.options.retryAttempts
      },
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add delay if specified
    if (job.options.delay > 0) {
      setTimeout(() => {
        this.enqueueJob(queue, job);
      }, job.options.delay);
    } else {
      this.enqueueJob(queue, job);
    }

    logger.debug(`Job added to queue ${queueName}: ${job.id}`);
    return job;
  }

  /**
   * Process jobs in a queue
   */
  async processQueue(queueName, processor) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} does not exist`);
    }

    this.workers.set(queueName, processor);
    
    if (!queue.processing) {
      queue.processing = true;
      this.startQueueProcessing(queue);
    }
  }

  /**
   * Add job for report generation (high priority background task)
   */
  async addReportGenerationJob(reportData, options = {}) {
    return this.addJob('reports', {
      type: 'generate_report',
      reportData,
      userId: options.userId,
      format: options.format || 'pdf'
    }, {
      priority: 10, // High priority
      maxAttempts: 2
    });
  }

  /**
   * Add job for data aggregation (medium priority background task)
   */
  async addDataAggregationJob(aggregationParams) {
    return this.addJob('data-processing', {
      type: 'aggregate_data',
      params: aggregationParams
    }, {
      priority: 5, // Medium priority
      maxAttempts: 3
    });
  }

  /**
   * Add job for cache warming (low priority background task)
   */
  async addCacheWarmingJob(cacheKeys) {
    return this.addJob('maintenance', {
      type: 'warm_cache',
      keys: cacheKeys
    }, {
      priority: 1, // Low priority
      maxAttempts: 1
    });
  }

  /**
   * Add job for database cleanup (low priority background task)
   */
  async addCleanupJob(cleanupType, params = {}) {
    return this.addJob('maintenance', {
      type: 'cleanup',
      cleanupType,
      params
    }, {
      priority: 1, // Low priority
      maxAttempts: 2
    });
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    return {
      name: queueName,
      stats: { ...queue.stats },
      jobCount: queue.jobs.length,
      processing: queue.processing,
      options: queue.options
    };
  }

  /**
   * Get all queue statistics
   */
  getAllQueueStats() {
    const stats = {};
    for (const [name, queue] of this.queues.entries()) {
      stats[name] = this.getQueueStats(name);
    }
    return stats;
  }

  /**
   * Pause a queue
   */
  pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.processing = false;
      logger.info(`Queue paused: ${queueName}`);
    }
  }

  /**
   * Resume a queue
   */
  resumeQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (queue && !queue.processing) {
      queue.processing = true;
      this.startQueueProcessing(queue);
      logger.info(`Queue resumed: ${queueName}`);
    }
  }

  /**
   * Clear all jobs from a queue
   */
  clearQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.jobs = [];
      queue.stats.waiting = 0;
      logger.info(`Queue cleared: ${queueName}`);
    }
  }

  /**
   * Initialize default queues
   */
  initializeDefaultQueues() {
    // High priority queue for reports
    this.createQueue('reports', {
      concurrency: 2,
      retryAttempts: 2,
      retryDelay: 2000
    });

    // Medium priority queue for data processing
    this.createQueue('data-processing', {
      concurrency: 3,
      retryAttempts: 3,
      retryDelay: 1000
    });

    // Low priority queue for maintenance tasks
    this.createQueue('maintenance', {
      concurrency: 1,
      retryAttempts: 1,
      retryDelay: 5000
    });

    // Email queue
    this.createQueue('emails', {
      concurrency: 2,
      retryAttempts: 3,
      retryDelay: 2000
    });

    logger.info('Default queues initialized');
  }

  // Private methods
  enqueueJob(queue, job) {
    // Insert job in priority order
    const insertIndex = queue.jobs.findIndex(existingJob => 
      existingJob.options.priority < job.options.priority
    );
    
    if (insertIndex === -1) {
      queue.jobs.push(job);
    } else {
      queue.jobs.splice(insertIndex, 0, job);
    }

    queue.stats.waiting++;
    this.emit('job:added', { queue: queue.name, job });
  }

  async startQueueProcessing(queue) {
    while (queue.processing && queue.jobs.length > 0) {
      if (queue.stats.active >= queue.options.concurrency) {
        await this.sleep(100); // Wait before checking again
        continue;
      }

      const job = queue.jobs.shift();
      if (!job) continue;

      queue.stats.waiting--;
      queue.stats.active++;
      job.status = 'active';
      job.updatedAt = new Date();

      this.processJob(queue, job);
    }
  }

  async processJob(queue, job) {
    const processor = this.workers.get(queue.name);
    if (!processor) {
      logger.error(`No processor found for queue: ${queue.name}`);
      return;
    }

    try {
      job.attempts++;
      this.emit('job:started', { queue: queue.name, job });

      const result = await processor(job);
      
      job.status = 'completed';
      job.result = result;
      job.updatedAt = new Date();
      
      queue.stats.active--;
      queue.stats.completed++;
      
      this.emit('job:completed', { queue: queue.name, job, result });
      logger.debug(`Job completed: ${job.id} in queue ${queue.name}`);

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();
      
      queue.stats.active--;

      // Retry logic
      if (job.attempts < job.options.maxAttempts) {
        logger.warn(`Job ${job.id} failed, retrying (${job.attempts}/${job.options.maxAttempts})`);
        
        setTimeout(() => {
          job.status = 'waiting';
          this.enqueueJob(queue, job);
        }, queue.options.retryDelay * job.attempts);
      } else {
        queue.stats.failed++;
        this.emit('job:failed', { queue: queue.name, job, error });
        logger.error(`Job ${job.id} failed permanently:`, error);
      }
    }

    // Continue processing
    if (queue.processing) {
      setImmediate(() => this.startQueueProcessing(queue));
    }
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new QueueManager();